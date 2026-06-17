# -*- coding: utf-8 -*-
"""Especificaciones reales por producto (handle -> datos).

Fuente: "CHAMPUS SAVIA DE ALMA - ESPECIFICACIONES.docx" (Elementos de marca).
Incluye INCI, nº de registro CPNP, % de ingredientes naturales (Norma Cosmos),
peso y nº de usos. Datos disponibles para los champus solidos.
"""

# Datos genericos de la gama de champus solidos.
GENERICO_CHAMPU = {
    "peso": "60 g · mas de 60 lavados",
    "fabricacion": "Elaborado a mano, uno a uno. Sin SLS ni SCI. Sin plastico (cero residuos). Vegano.",
}

SPECS = {
    "champu-te-matcha": {
        "cpnp": "3175569",
        "natural": "94,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Camellia Sinensis Leaf Extract, Parfum, Geraniol, Hexyl Cinnamal, Limonene, Linalool, CI 74160, CI 21100.",
    },
    "champu-cebolla-arcilla": {
        "cpnp": "3859334",
        "natural": "98% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Allium cepa bulb Extract, Parfum, Illite, Limonene.",
    },
    "champu-indigo-lavanda": {
        "cpnp": "4148266",
        "natural": "96,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Lavandula Angustifolia Flower Oil, Parfum, Indigofera Tinctoria Leaf Powder, CI 77007, Alpha-Isomethyl Ionone, Hydroxycitronellal, Limonene, Linalool.",
    },
    "champu-betaina-sal": {
        "cpnp": "3987564",
        "natural": "96% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Cocamidopropyl Betaine, Aqua, Parfum, Sodium Chloride, Amyl Cinnamal, Benzyl Alcohol, Benzyl Salicylate, Citral, Geraniol, Hexyl Cinnamal, Limonene, Linalool, CI 19140.",
    },
    "champu-romero-quina": {
        "cpnp": "3907972",
        "natural": "98% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Cinchona calisaya bark Extract, Rosmarinus officinalis leaf Extract, Illite, Kaolin, Alcohol Denat, Parfum, Benzyl Benzoate, Cinnamal, Citral, Citronellol, Coumarin, Eugenol, Farnesol, Alpha-Isomethyl Ionone, Geraniol, Hydroxycitronellal, Isoeugenol, Limonene, Linalool.",
    },
    "champu-cafeina-canela": {
        "cpnp": "3859323",
        "natural": "92,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Parfum, Coffea arabica seed Powder, Caffeine, Cinnamomum cassia Bark, Benzyl Benzoate, Cinnamal, Cinnamyl Alcohol, Coumarin, Eugenol.",
    },
    "champu-cade-enebro": {
        "cpnp": "3852869",
        "natural": "92,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Juniperus oxycedrus Wood Oil.",
    },
    "champu-avena-almendra": {
        "cpnp": "3907967",
        "natural": "Ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Cocos nucifera Oil, Aqua, Kaolin, Illite, Avena Sativa Kernel Extract, Prunus Amygdalus Dulcis Oil, Parfum, Citronellol, Alpha-Isomethyl Ionone, Hexyl Cinnamal, Limonene, Linalool.",
    },
    "champu-cacao": {
        "cpnp": "3175568",
        "natural": "96,5% ingredientes naturales (Norma Cosmos)",
        "inci": "Sodium Coco-Sulfate, Theobroma cacao seed powder, Aqua, Cocos nucifera Oil, Parfum, Butyrospermum parkii butter, Theobroma cacao seed butter, Cinnamal, Coumarine.",
    },
}

# Aplica los datos genericos de gama a cada champu.
for _h, _v in SPECS.items():
    if _h.startswith("champu-"):
        _v.setdefault("peso", GENERICO_CHAMPU["peso"])
        _v.setdefault("fabricacion", GENERICO_CHAMPU["fabricacion"])
