# Category: TensorFlow Basics

# START
# Title: Import TensorFlow
# Output: None
import tensorflow as tf
print(f"TensorFlow version: {tf.__version__}")
# END

# START
# Title: Create Tensor
# Output: tf.Tensor
import tensorflow as tf
tensor = tf.constant([[1, 2], [3, 4]])
print(tensor)
# END

# START
# Title: Check GPU Availability
# Output: bool
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
print(f"GPUs available: {len(gpus)}")
# END

# START
# Title: Set Memory Growth
# Output: None
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)
# END

