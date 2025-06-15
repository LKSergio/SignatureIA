import os
import cv2
import numpy as np
import random
from itertools import combinations
import matplotlib.pyplot as plt

from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Conv2D, Flatten, Dense, Lambda
from tensorflow.keras.optimizers import Adam
import tensorflow.keras.backend as K

# Fijar semilla
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

IMG_SIZE = (150, 200)  # ancho x alto para cv2.resize
DATASET_DIR = "./resources"

def load_dataset(dataset_dir, size=IMG_SIZE):
    data = []
    person_dirs = sorted(os.listdir(dataset_dir))

    for idx, person in enumerate(person_dirs):
        person_path = os.path.join(dataset_dir, person)
        if os.path.isdir(person_path):
            images = []
            for fname in os.listdir(person_path):
                try:
                    fpath = os.path.join(person_path, fname)
                    img = cv2.imread(fpath, cv2.IMREAD_GRAYSCALE)
                    if img is None:
                        raise Exception("Imagen no válida")
                    img = cv2.resize(img, size)
                    img = img.astype("float32") / 127.5 - 1.0  # Escalado a [-1, 1]
                    img = np.expand_dims(img, axis=-1)  # Añadir canal
                    images.append((img, idx, person))
                except Exception as e:
                    print(f"Error cargando {fpath}: {e}")
            if len(images) >= 2:
                data.append(images)
    return data

def generate_pairs(data, num_negatives_per_positive=1):
    pairs = []
    labels = []
    meta_info = []
    num_classes = len(data)

    for i, person_imgs in enumerate(data):
        for (img1, idx1, name1), (img2, idx2, name2) in combinations(person_imgs, 2):
            pairs.append([img1, img2])
            labels.append(1)
            meta_info.append(((idx1, name1), (idx2, name2)))

            for _ in range(num_negatives_per_positive):
                while True:
                    j = random.randint(0, num_classes - 1)
                    if j != i:
                        break
                img_neg, idx_neg, name_neg = random.choice(data[j])
                pairs.append([img1, img_neg])
                labels.append(0)
                meta_info.append(((idx1, name1), (idx_neg, name_neg)))

    return np.array(pairs), np.array(labels), meta_info

def show_pair(img1, img2, label, meta):
    (idx1, name1), (idx2, name2) = meta
    fig, ax = plt.subplots(1, 2)
    ax[0].imshow(img1.squeeze(), cmap="gray")
    ax[0].set_title(f"{name1} (#{idx1})")
    ax[1].imshow(img2.squeeze(), cmap="gray")
    ax[1].set_title(f"{name2} (#{idx2})")
    plt.suptitle(f"Etiqueta: {'Iguales' if label == 1 else 'Diferentes'}")
    plt.show()

print("📂 Cargando dataset...")
data = load_dataset(DATASET_DIR)

print("🔧 Generando pares de entrenamiento...")
pairs, labels, meta_info = generate_pairs(data)

X1 = np.array([pair[0] for pair in pairs])
X2 = np.array([pair[1] for pair in pairs])
y = np.array(labels)

print(f"✅ Listo. Pares generados: {len(pairs)}")
print(f"X1 shape: {X1.shape}, X2 shape: {X2.shape}, y shape: {y.shape}")

# Mostrar un ejemplo
i = random.randint(0, len(X1) - 1)
show_pair(X1[i], X2[i], y[i], meta_info[i])

def siamese_model(input_shape=(200, 150, 1)):  # alto, ancho, canal
    input_img = Input(input_shape)
    x = Conv2D(64, (3, 3), activation='relu', padding='same')(input_img)
    x = Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = Flatten()(x)
    x = Dense(128, activation='relu')(x)
    embedding = Dense(128)(x)
    return Model(inputs=input_img, outputs=embedding)

def euclidean_distance(vects):
    (feats1, feats2) = vects
    sum_squared = K.sum(K.square(feats1 - feats2), axis=1, keepdims=True)
    return K.sqrt(K.maximum(sum_squared, K.epsilon()))

# Modelo base y siamese
base_model = siamese_model(input_shape=(200, 150, 1))
input_a = Input(shape=(200, 150, 1))
input_b = Input(shape=(200, 150, 1))

embedding_a = base_model(input_a)
embedding_b = base_model(input_b)
distance = Lambda(euclidean_distance)([embedding_a, embedding_b])

siamese_net = Model(inputs=[input_a, input_b], outputs=distance)

# Compilar
siamese_net.compile(loss='binary_crossentropy', optimizer=Adam(learning_rate=0.0001), metrics=['accuracy'])

siamese_net.summary()

# Entrenamiento
history = siamese_net.fit(
    [X1, X2], y,
    batch_size=32,
    epochs=10,
    validation_split=0.2
)

# Visualización de métricas
plt.figure(figsize=(12, 5))

# Loss
plt.subplot(1, 2, 1)
plt.plot(history.history['loss'], label='Entrenamiento')
plt.plot(history.history['val_loss'], label='Validación')
plt.title('Pérdida (Loss)')
plt.xlabel('Épocas')
plt.ylabel('Pérdida')
plt.legend()

# Accuracy
plt.subplot(1, 2, 2)
plt.plot(history.history['accuracy'], label='Entrenamiento')
plt.plot(history.history['val_accuracy'], label='Validación')
plt.title('Precisión (Accuracy)')
plt.xlabel('Épocas')
plt.ylabel('Precisión')
plt.legend()

plt.tight_layout()
plt.show()
