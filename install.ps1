# Claude Terminal Queue Manager 설치 스크립트
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Claude Terminal Queue Manager 설치" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 빌드
Write-Host "[1/3] 빌드 중..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "빌드 실패!" -ForegroundColor Red
    exit 1
}

# 2. 패키징
Write-Host ""
Write-Host "[2/3] VSIX 패키징 중..." -ForegroundColor Yellow
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-Host "패키징 실패!" -ForegroundColor Red
    exit 1
}

# 3. 설치
Write-Host ""
Write-Host "[3/3] VS Code에 설치 중..." -ForegroundColor Yellow
$vsixFile = Get-ChildItem -Filter "*.vsix" | Select-Object -First 1

if ($vsixFile) {
    Write-Host "설치: $($vsixFile.Name)" -ForegroundColor Green
    code --install-extension $vsixFile.FullName --force

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "설치 완료!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "다음 단계:" -ForegroundColor Yellow
        Write-Host "1. VS Code 재시작" -ForegroundColor White
        Write-Host "2. Ctrl+Shift+P -> 'Claude: Simulate' 테스트" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "설치 실패!" -ForegroundColor Red
    }
} else {
    Write-Host "VSIX 파일을 찾을 수 없습니다!" -ForegroundColor Red
}
