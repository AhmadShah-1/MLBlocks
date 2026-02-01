# Category: Image Transforms

# START
# Title: Resize Image
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
resized = img.resize((224, 224))
# END

# START
# Title: Rotate Image
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
rotated = img.rotate(45)
# END

# START
# Title: Crop Image
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
# crop(left, upper, right, lower)
cropped = img.crop((100, 100, 400, 400))
# END

# START
# Title: Convert to Grayscale
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
gray = img.convert("L")
# END

# START
# Title: Flip Image Horizontal
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
# END

