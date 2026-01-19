# E-Commerce Flow Integration Test
# Tests the complete serverless order processing system

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [string]$ApiEndpoint = "https://zb28eyn4nb.execute-api.us-east-1.amazonaws.com/prod/orders",
    
    [string]$ProductId = "PROD001",
    
    [int]$Quantity = 1,
    
    [string]$TestEmail = "test@example.com"
)

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "E-COMMERCE FLOW INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Create temporary key file (NO BOM)
$keyFile = "temp-key-$ProductId.json"
$keyContent = '{"productId":{"S":"' + $ProductId + '"}}'
[System.IO.File]::WriteAllText($keyFile, $keyContent)

# Step 1: Check initial inventory
Write-Host "[1/6] Checking initial inventory..." -ForegroundColor Yellow
$inventoryBefore = aws dynamodb get-item --table-name Inventory --key file://$keyFile --region us-east-1 | ConvertFrom-Json

if ($inventoryBefore.Item) {
    $stockBefore = [int]$inventoryBefore.Item.stock.N
    Write-Host "  > Current stock for ${ProductId}: $stockBefore" -ForegroundColor Green
} else {
    Write-Host "  x Product $ProductId not found in inventory!" -ForegroundColor Red
    Remove-Item $keyFile -ErrorAction SilentlyContinue
    exit 1
}

# Step 2: Place order
Write-Host "`n[2/6] Placing order..." -ForegroundColor Yellow
$body = @{
    productId = $ProductId
    quantity = $Quantity
    customerEmail = $TestEmail
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $ApiEndpoint -Method POST -Body $body -ContentType "application/json" -Headers @{"x-api-key"=$ApiKey}
    $orderId = $response.orderId
    Write-Host "  > Order placed successfully!" -ForegroundColor Green
    Write-Host "    Order ID: $orderId" -ForegroundColor White
}
catch {
    Write-Host "  x Failed to place order" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item $keyFile -ErrorAction SilentlyContinue
    exit 1
}

# Step 3: Wait for async processing
Write-Host "`n[3/6] Waiting for event processing (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "  > Wait complete" -ForegroundColor Green

# Step 4: Verify inventory decreased
Write-Host "`n[4/6] Verifying inventory update..." -ForegroundColor Yellow
$inventoryAfter = aws dynamodb get-item --table-name Inventory --key file://$keyFile --region us-east-1 | ConvertFrom-Json

if ($inventoryAfter.Item) {
    $stockAfter = [int]$inventoryAfter.Item.stock.N
    $expectedStock = $stockBefore - $Quantity

    if ($stockAfter -eq $expectedStock) {
        Write-Host "  > Inventory updated correctly!" -ForegroundColor Green
        Write-Host "    Before: $stockBefore -> After: $stockAfter (decreased by $Quantity)" -ForegroundColor White
    }
    else {
        Write-Host "  x Inventory mismatch!" -ForegroundColor Red
        Write-Host "    Expected: $expectedStock, Got: $stockAfter" -ForegroundColor Red
    }
} else {
    Write-Host "  x Failed to retrieve inventory after order" -ForegroundColor Red
    $stockAfter = 0
}

# Step 5: Check Lambda execution logs
Write-Host "`n[5/6] Checking service execution logs..." -ForegroundColor Yellow

$services = @("OrderProcessor", "InventoryService", "PaymentService", "NotificationService")
$executionResults = @{}

foreach ($service in $services) {
    try {
        $logs = aws logs tail /aws/lambda/$service --since 2m --region us-east-1 2>$null | Out-String
        
        if ($logs -match "ERROR|Error|error") {
            Write-Host "  ! $service executed with errors" -ForegroundColor Yellow
            $executionResults[$service] = "ERROR"
        }
        elseif ($logs -match $orderId) {
            Write-Host "  > $service executed successfully" -ForegroundColor Green
            $executionResults[$service] = "SUCCESS"
        }
        else {
            Write-Host "  ? $service status unknown (no logs found)" -ForegroundColor Gray
            $executionResults[$service] = "UNKNOWN"
        }
    }
    catch {
        Write-Host "  x Failed to retrieve $service logs" -ForegroundColor Red
        $executionResults[$service] = "FAILED"
    }
}

# Clean up temp file
Remove-Item $keyFile -ErrorAction SilentlyContinue

# Step 6: Summary
Write-Host "`n[6/6] Test Summary" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan

$successCount = ($executionResults.Values | Where-Object { $_ -eq "SUCCESS" }).Count
$totalServices = $executionResults.Count

Write-Host "Order ID:        $orderId" -ForegroundColor White
Write-Host "Product:         $ProductId" -ForegroundColor White
Write-Host "Quantity:        $Quantity" -ForegroundColor White
Write-Host "Stock Change:    $stockBefore -> $stockAfter" -ForegroundColor White
Write-Host "Services OK:     $successCount/$totalServices" -ForegroundColor White

if ($successCount -eq $totalServices -and $stockAfter -eq ($stockBefore - $Quantity)) {
    Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "The complete e-commerce flow is working correctly.`n" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "`nSOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "Check CloudWatch logs for details.`n" -ForegroundColor Yellow
    exit 1
}
