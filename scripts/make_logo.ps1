Add-Type -AssemblyName System.Drawing

$width = 512
$height = 512
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Palette
# Black mix
$cBlack = [System.Drawing.Color]::FromArgb(255, 8, 12, 20)
# Ice Cold: #a0d2eb
$cIceCold = [System.Drawing.Color]::FromArgb(255, 160, 210, 235)
# Freeze Purple: #e5eaf5
$cFreezePurple = [System.Drawing.Color]::FromArgb(255, 229, 234, 245)
$cDeepBorder = [System.Drawing.Color]::FromArgb(255, 30, 42, 64)

# Background Fill
$bgBrush = New-Object System.Drawing.SolidBrush($cBlack)
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Rounded canvas container
$rect = New-Object System.Drawing.Rectangle(16, 16, 480, 480)
$borderPen = New-Object System.Drawing.Pen($cDeepBorder, 6)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 90
$path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
$path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
$path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()
$g.DrawPath($borderPen, $path)

# Outer Shield in Ice Cold
$shieldPen = New-Object System.Drawing.Pen($cIceCold, 14)
$shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$shieldPath.AddLine(256, 70, 120, 120)
$shieldPath.AddLine(120, 120, 120, 240)
$shieldPath.AddBezier(120, 240, 130, 360, 220, 420, 256, 440)
$shieldPath.AddBezier(256, 440, 292, 420, 382, 360, 392, 240)
$shieldPath.AddLine(392, 240, 392, 120)
$shieldPath.AddLine(392, 120, 256, 70)
$shieldPath.CloseFigure()

$shieldFillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 21, 36))
$g.FillPath($shieldFillBrush, $shieldPath)
$g.DrawPath($shieldPen, $shieldPath)

# Inner Shield Highlight in Freeze Purple
$innerShieldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 229, 234, 245), 4)
$innerShieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$innerShieldPath.AddLine(256, 95, 140, 138)
$innerShieldPath.AddLine(140, 138, 140, 235)
$innerShieldPath.AddBezier(140, 235, 150, 335, 230, 390, 256, 410)
$innerShieldPath.AddBezier(256, 410, 282, 390, 362, 335, 372, 235)
$innerShieldPath.AddLine(372, 235, 372, 138)
$innerShieldPath.AddLine(372, 138, 256, 95)
$innerShieldPath.CloseFigure()
$g.DrawPath($innerShieldPen, $innerShieldPath)

# Kernel Core Chip
$chipBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 30, 50))
$chipPen = New-Object System.Drawing.Pen($cFreezePurple, 6)
$g.FillRectangle($chipBrush, 196, 180, 120, 120)
$g.DrawRectangle($chipPen, 196, 180, 120, 120)

# Bus pins in Ice Cold
$pinPen = New-Object System.Drawing.Pen($cIceCold, 7)
$nodeBrush = New-Object System.Drawing.SolidBrush($cFreezePurple)

# Vertical bus
$g.DrawLine($pinPen, 256, 130, 256, 180)
$g.DrawLine($pinPen, 256, 300, 256, 350)
# Horizontal bus
$g.DrawLine($pinPen, 146, 240, 196, 240)
$g.DrawLine($pinPen, 316, 240, 366, 240)

# Bus Terminal Nodes in Freeze Purple
$g.FillEllipse($nodeBrush, 249, 123, 14, 14)
$g.FillEllipse($nodeBrush, 249, 343, 14, 14)
$g.FillEllipse($nodeBrush, 139, 233, 14, 14)
$g.FillEllipse($nodeBrush, 359, 233, 14, 14)

# Central Core Glowing Orb
$coreGlowBrush = New-Object System.Drawing.SolidBrush($cIceCold)
$g.FillEllipse($coreGlowBrush, 232, 216, 48, 48)

$coreInnerBrush = New-Object System.Drawing.SolidBrush($cFreezePurple)
$g.FillEllipse($coreInnerBrush, 244, 228, 24, 24)

# Save to frontend/public/logo.png
$outPath = Resolve-Path "frontend\public\logo.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Output "logo.png successfully created at $outPath"
