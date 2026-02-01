# Category: TensorFlow Models

# START
# Title: Sequential Model
# Output: tf.keras.Model
import tensorflow as tf
from tensorflow.keras import layers

model = tf.keras.Sequential([
    layers.Dense(64, activation='relu'),
    layers.Dense(32, activation='relu'),
    layers.Dense(10, activation='softmax')
])
# END

# START
# Title: Compile Model
# Output: None
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)
# END

# START
# Title: Model Summary
# Output: None
model.summary()
# END

# START
# Title: Train Model
# Output: tf.keras.callbacks.History
history = model.fit(
    x_train, y_train,
    epochs=10,
    batch_size=32,
    validation_split=0.2
)
# END

# START
# Title: Evaluate Model
# Output: list
loss, accuracy = model.evaluate(x_test, y_test)
print(f"Loss: {loss}, Accuracy: {accuracy}")
# END

# START
# Title: Save Model
# Output: None
model.save("my_model.keras")
# END

# START
# Title: Load Model
# Output: tf.keras.Model
import tensorflow as tf
model = tf.keras.models.load_model("my_model.keras")
# END

