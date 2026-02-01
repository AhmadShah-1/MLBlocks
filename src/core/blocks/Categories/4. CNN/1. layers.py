# Category: CNN Layers

# START
# Title: Conv2D Layer
# Output: tf.keras.layers.Conv2D
from tensorflow.keras import layers

conv_layer = layers.Conv2D(
    filters=32,
    kernel_size=(3, 3),
    activation='relu',
    padding='same'
)
# END

# START
# Title: MaxPooling2D Layer
# Output: tf.keras.layers.MaxPooling2D
from tensorflow.keras import layers

pool_layer = layers.MaxPooling2D(pool_size=(2, 2))
# END

# START
# Title: Flatten Layer
# Output: tf.keras.layers.Flatten
from tensorflow.keras import layers

flatten = layers.Flatten()
# END

# START
# Title: Dropout Layer
# Output: tf.keras.layers.Dropout
from tensorflow.keras import layers

dropout = layers.Dropout(rate=0.5)
# END

# START
# Title: BatchNormalization Layer
# Output: tf.keras.layers.BatchNormalization
from tensorflow.keras import layers

bn = layers.BatchNormalization()
# END

