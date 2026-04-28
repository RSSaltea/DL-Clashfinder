Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root "public\download-lineup-2026.jpg"
$outputDir = Join-Path $root "public\artist-lineup-crops"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$entries = @"
friday-apex-limp-bizkit,68,194,204,145
friday-apex-cypress-hill,72,351,190,47
friday-apex-electric-callboy,80,424,178,56
friday-apex-pendulum,82,496,182,34
friday-apex-hollywood-undead,70,538,198,25
friday-apex-p-o-d,118,563,86,22
friday-apex-scene-queen,92,584,142,23
saturday-apex-guns-n-roses,350,190,202,154
saturday-apex-trivium,396,355,112,58
saturday-apex-babymetal,362,418,180,66
saturday-apex-black-veil-brides,358,506,184,35
saturday-apex-landmvrks,400,548,110,21
saturday-apex-south-arcade,390,570,130,21
saturday-apex-thornhill,405,592,100,21
sunday-apex-linkin-park,633,196,188,126
sunday-apex-bad-omens,648,354,166,60
sunday-apex-ice-nine-kills,676,426,105,86
sunday-apex-the-pretty-reckless,670,510,120,72
sunday-apex-bloodywood,675,552,108,21
sunday-apex-rory,700,574,58,21
sunday-apex-kublai-khan-tx,637,596,132,21
sunday-apex-unpeople,777,596,86,21
friday-opus-halestorm,64,653,190,60
friday-opus-daughtry,72,724,188,32
friday-opus-periphery,108,766,96,21
friday-opus-creeper,116,786,78,20
friday-opus-paleface-swiss,96,806,132,20
friday-opus-silent-planet,98,826,132,20
friday-opus-caskets,120,846,82,20
saturday-opus-architects,348,642,208,48
saturday-opus-behemoth,394,700,118,56
saturday-opus-bush,424,754,58,21
saturday-opus-set-it-off,402,775,92,20
saturday-opus-those-damn-crows,378,795,148,20
saturday-opus-we-came-as-romans,342,815,150,20
saturday-opus-drowning-pool,488,815,112,20
saturday-opus-snot,400,836,58,20
saturday-opus-the-wildhearts,448,836,116,20
sunday-opus-a-day-to-remember,662,640,154,74
sunday-opus-mastodon,660,724,154,42
sunday-opus-tom-morello,676,771,106,21
sunday-opus-social-distortion,652,792,154,21
sunday-opus-the-plot-in-you,674,812,112,20
sunday-opus-thrown,634,833,62,20
sunday-opus-dogstar,690,833,76,20
sunday-opus-mammoth,760,833,84,20
sunday-opus-catch-your-breath,622,854,138,20
sunday-opus-ego-kill-talent,756,854,114,20
friday-avalanche-feeder,68,868,194,62
friday-avalanche-story-of-the-year,100,930,132,21
friday-avalanche-sleep-theory,106,950,118,21
friday-avalanche-rain-city-drive,100,970,132,21
friday-avalanche-drain,128,990,70,20
friday-avalanche-lakeview,78,1010,88,20
friday-avalanche-holywatr,154,1010,94,20
friday-avalanche-silly-goose,78,1029,98,20
friday-avalanche-native-james,174,1029,98,20
saturday-avalanche-the-all-american-rejects,338,873,232,60
saturday-avalanche-hot-milk,420,938,72,21
saturday-avalanche-marmozets,404,958,102,21
saturday-avalanche-as-it-is,422,978,66,21
saturday-avalanche-melrose-avenue,340,998,132,21
saturday-avalanche-mouth-culture,474,998,120,21
saturday-avalanche-die-spitz,372,1018,84,21
saturday-avalanche-nevertel,452,1018,88,21
saturday-avalanche-frozemode,402,1038,102,21
sunday-avalanche-scooter,660,874,172,50
sunday-avalanche-letlive,692,938,78,21
sunday-avalanche-ash,710,958,44,21
sunday-avalanche-dinosaur-pile-up,660,978,134,21
sunday-avalanche-magnolia-park,650,998,132,21
sunday-avalanche-tx2,778,998,48,21
sunday-avalanche-the-pretty-wild,656,1018,132,21
sunday-avalanche-ivri,784,1018,48,21
sunday-avalanche-zero-9-36,668,1038,90,21
friday-dogtooth-cavalera,70,1047,170,42
friday-dogtooth-corrosion-of-conformity,64,1106,200,22
friday-dogtooth-band-maid,54,1124,92,20
friday-dogtooth-stampin-ground,136,1124,122,20
friday-dogtooth-the-primals,250,1124,88,20
friday-dogtooth-lake-malice,70,1142,92,20
friday-dogtooth-nasty,146,1142,58,20
friday-dogtooth-vianova,198,1142,74,20
friday-dogtooth-james-and-the-cold-gun,84,1162,170,20
friday-dogtooth-slay-squad,86,1182,92,20
friday-dogtooth-headwreck,176,1182,98,20
saturday-dogtooth-blood-incantation,392,1058,132,62
saturday-dogtooth-decapitated,404,1124,100,22
saturday-dogtooth-elder,330,1143,62,20
saturday-dogtooth-sweet-savage,384,1143,116,20
saturday-dogtooth-self-deception,494,1143,122,20
saturday-dogtooth-as-everything-unfolds,320,1162,164,20
saturday-dogtooth-return-to-dust,482,1162,116,20
saturday-dogtooth-conjurer,364,1181,86,20
saturday-dogtooth-lowen,446,1181,66,20
saturday-dogtooth-tailgunner,506,1181,96,20
saturday-dogtooth-tropic-gold,366,1200,104,20
saturday-dogtooth-pussyliquor,464,1200,112,20
sunday-dogtooth-static-x,664,1055,166,38
sunday-dogtooth-spineshank,690,1123,104,20
sunday-dogtooth-gatecreeper,632,1142,106,20
sunday-dogtooth-boundaries,738,1142,96,20
sunday-dogtooth-ankor,808,1142,62,20
sunday-dogtooth-annisokay,660,1161,88,20
sunday-dogtooth-last-train,744,1161,90,20
sunday-dogtooth-decessus,648,1180,84,20
sunday-dogtooth-wayside,728,1180,76,20
sunday-dogtooth-private-school,622,1199,116,20
sunday-dogtooth-spitting-glass,736,1199,116,20
"@.Trim().Split("`n")

$source = [System.Drawing.Image]::FromFile($sourcePath)
$jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  [int64]92
)

try {
  foreach ($entry in $entries) {
    $parts = $entry.Split(",")
    $id = $parts[0]
    $x = [int]$parts[1]
    $y = [int]$parts[2]
    $w = [int]$parts[3]
    $h = [int]$parts[4]

    $padding = 8
    $cropX = [Math]::Max(0, $x - $padding)
    $cropY = [Math]::Max(0, $y - $padding)
    $cropRight = [Math]::Min($source.Width, $x + $w + $padding)
    $cropBottom = [Math]::Min($source.Height, $y + $h + $padding)
    $cropWidth = $cropRight - $cropX
    $cropHeight = $cropBottom - $cropY

    $bitmap = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage(
      $source,
      (New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)),
      (New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)),
      [System.Drawing.GraphicsUnit]::Pixel
    )
    $graphics.Dispose()

    $outputPath = Join-Path $outputDir "$id.jpg"
    $bitmap.Save($outputPath, $jpgCodec, $encoderParams)
    $bitmap.Dispose()
  }
} finally {
  $source.Dispose()
  $encoderParams.Dispose()
}
