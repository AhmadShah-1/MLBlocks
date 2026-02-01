# Category: Image Loading

# START
# Title: Load Image with PIL
# Output: PIL.Image
from PIL import Image
img = Image.open("image.jpg")
print(img.size)
# END

# START
# Title: Load Image with OpenCV
# Output: np.ndarray
import cv2
img = cv2.imread("image.jpg")
print(img.shape)
# END

# START
# Title: Convert PIL to Numpy
# Output: np.ndarray
import numpy as np
from PIL import Image
img = Image.open("image.jpg")
arr = np.array(img)
print(arr.shape)
# END

# START
# Title: Save Image
# Output: None
from PIL import Image
img = Image.open("input.jpg")
img.save("output.png")
# END

