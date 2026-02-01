# Category: Complete CNN Models

# START
# Title: Simple CNN Classifier
# Output: tf.keras.Model
import tensorflow as tf
from tensorflow.keras import layers

model = tf.keras.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')
])
# END

# START
# Title: VGG-like CNN
# Output: tf.keras.Model
import tensorflow as tf
from tensorflow.keras import layers

def vgg_block(num_convs, num_channels):
    blk = tf.keras.Sequential()
    for _ in range(num_convs):
        blk.add(layers.Conv2D(num_channels, (3, 3), padding='same', activation='relu'))
    blk.add(layers.MaxPooling2D((2, 2)))
    return blk

model = tf.keras.Sequential([
    vgg_block(2, 64),
    vgg_block(2, 128),
    vgg_block(3, 256),
    layers.Flatten(),
    layers.Dense(4096, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(4096, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(10, activation='softmax')
])
# END

# START
# Title: ResNet Block
# Output: tf.keras.Model
import tensorflow as tf
from tensorflow.keras import layers

class ResidualBlock(layers.Layer):
    def __init__(self, filters, stride=1):
        super().__init__()
        self.conv1 = layers.Conv2D(filters, 3, strides=stride, padding='same')
        self.bn1 = layers.BatchNormalization()
        self.conv2 = layers.Conv2D(filters, 3, padding='same')
        self.bn2 = layers.BatchNormalization()
        
        if stride != 1:
            self.shortcut = tf.keras.Sequential([
                layers.Conv2D(filters, 1, strides=stride),
                layers.BatchNormalization()
            ])
        else:
            self.shortcut = lambda x: x
    
    def call(self, x):
        out = tf.nn.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        return tf.nn.relu(out)
# END

# START
# Title: Image Data Augmentation
# Output: tf.keras.Sequential
import tensorflow as tf
from tensorflow.keras import layers

data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.1),
])
# END

