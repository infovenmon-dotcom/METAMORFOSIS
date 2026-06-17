# -*- coding: utf-8 -*-
"""Bullet points tipo Amazon por producto (handle -> lista de puntos clave).

Redactados a partir del documento de especificaciones de marca. Mensajes
breves, en clave de beneficio, con la primera idea en mayusculas (estilo
listing de Amazon). Disponibles para los champus solidos.
"""

BULLETS = {
    "champu-te-matcha": [
        "USO FRECUENTE PARA TODA LA FAMILIA: formula suave para cabello normal, ni seco ni graso.",
        "ANTIOXIDANTE NATURAL: el te verde ayuda a proteger del envejecimiento y la agresion externa.",
        "HIDRATA CON ACEITE DE COCO: limpia y cuida el cabello sin resecarlo.",
        "94,5% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-cebolla-arcilla": [
        "EFECTO CRECIMIENTO: extracto de cebolla rico en azufre y quercetina que estimula el foliculo.",
        "ANTICAIDA Y FORTALECEDOR: mejora la circulacion del cuero cabelludo y da fuerza al cabello.",
        "ARCILLA ROJA PURIFICANTE: limpieza profunda del cuero cabelludo sin resecar.",
        "98% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-indigo-lavanda": [
        "MATIZA CANAS Y PELO BLANCO: el indigo natural neutraliza los tonos amarillos.",
        "ACEITE ESENCIAL DE LAVANDA: calma, fortalece el folrculo y aporta aroma natural.",
        "BRILLO Y CUIDADO DEL COLOR: apto para uso diario sin resecar el cabello.",
        "96,5% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-betaina-sal": [
        "PARA CABELLO GRASO: betaina y sal marina regulan el exceso de grasa del cuero cabelludo.",
        "SENSACION DE LIMPIO MAS DIAS: equilibra y permite espaciar los lavados.",
        "AROMA POMELO: fresco y duradero, apto para uso diario.",
        "96% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-romero-quina": [
        "VOLUMEN Y CUERPO: ideal para cabello fino, lacio y sin volumen.",
        "ROMERO + QUINA (RONQUINA): tonico natural anticaida que densifica la fibra capilar.",
        "REGULA LA GRASA: arcilla astringente que activa la circulacion del folculo.",
        "98% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-cafeina-canela": [
        "EFECTO ANTICAIDA: la cafeina estimula el crecimiento y frena la fase de caida.",
        "CANELA PURIFICANTE: limpia los folrculos y ayuda a un cuero cabelludo sano.",
        "PELO MAS FUERTE Y DENSO: indicado para cabello debil o fino.",
        "92,5% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-cade-enebro": [
        "ALIVIA CASPA, PSORIASIS Y ECCEMAS: aceite de cade de enebro (brea) sobre cuero cabelludo sensible.",
        "CALMA EL PICOR: propiedades antisepticas, antieccematicas y fungicidas.",
        "DESCAMANTE NATURAL: ayuda a eliminar la caspa y a que no vuelva a formarse.",
        "92,5% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-avena-almendra": [
        "PARA PELO RIZADO: define el rizo y le aporta movimiento y flexibilidad.",
        "EXTRACTO DE AVENA: emoliente y suavizante natural, calma e hidrata.",
        "ACEITE DE ALMENDRA: nutre, refuerza la fibra capilar y da brillo.",
        "INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
    "champu-cacao": [
        "REPARACION PROFUNDA: para cabello seco, danado o tenido que necesita hidratacion extra.",
        "MANTECA DE CACAO Y KARITE: aportan suavidad, brillo y flexibilidad como acondicionador.",
        "AROMA A COOKIES: original y goloso, deja el pelo sedoso.",
        "96,5% INGREDIENTES NATURALES (Cosmos): sin SLS ni SCI, vegano y sin plastico.",
        "60 g · +60 LAVADOS: elaborado a mano, uno a uno, en Espana.",
    ],
}

# --- Bullets de jabones, faciales, depilacion y barba (de los documentos del Drive) ---
BULLETS.update({
    "jabon-pepita-uva": [
        "ANTIOXIDANTE natural que combate los radicales libres y el envejecimiento.",
        "REVITALIZA y devuelve la luz a pieles opacas o cansadas.",
        "TONIFICA aportando firmeza y elasticidad con vitamina E.",
        "VEGANO y biodegradable, sin parabenos, siliconas ni perfumes sinteticos.",
        "HECHO en Espana a mano, en pequenos lotes.",
    ],
    "jabon-karite": [
        "HIDRATACION intensiva y prolongada para piel seca o sensible.",
        "REPARA y protege con lipidos naturales y vitaminas A y E.",
        "ESPUMA untuosa y reconfortante que envuelve la piel.",
        "VEGANO, biodegradable y zero waste, sin parabenos ni siliconas.",
        "FABRICADO en Espana en pequenos lotes.",
    ],
    "jabon-argan": [
        "HIDRATACION intensa y duradera con aceite de argan.",
        "PIEL mas elastica, luminosa y firme con el uso regular.",
        "ESPUMA sedosa y aroma calido para un ritual regenerador.",
        "COSMETICA solida vegana, sin siliconas ni parabenos.",
        "HECHO en Espana a mano, en pequenos lotes.",
    ],
    "jabon-arbol-te": [
        "PURIFICA en profundidad y desobstruye los poros sin agredir.",
        "SEBORREGULADOR: reduce el brillo sin resecar la piel.",
        "AROMA herbal fresco que revitaliza cuerpo y mente.",
        "VEGANO, libre de toxicos y con embalaje sostenible.",
        "HECHO en Espana a mano, en pequenos lotes.",
    ],
    "jabon-lavanda": [
        "RELAJA cuerpo y mente, ayudando a reducir el estres.",
        "IDEAL para pieles sensibles y delicadas, sin agredir.",
        "AROMA floral que envuelve como campos de lavanda.",
        "VEGANO, biodegradable y libre de toxicos y plasticos.",
        "FABRICADO en Espana a mano, en pequenos lotes.",
    ],
    "jabon-rosa-mosqueta": [
        "REGENERA la piel difuminando marcas, cicatrices y lineas.",
        "HIDRATA en profundidad aportando una suavidad sedosa.",
        "FRAGANCIA floral para una experiencia intima y sensorial.",
        "VEGANO, biodegradable y con embalaje sostenible.",
        "FABRICADO a mano en Espana con ingredientes naturales.",
    ],
    "limpiador-facial-aloe-pepino": [
        "HIDRATA y calma la piel gracias al aloe vera.",
        "AROMA a pepino relajante que convierte la limpieza en un ritual.",
        "PH semejante al de la piel, sin SCI ni SLS.",
        "ECOLOGICO y solido, alternativa sin envase plastico.",
        "DURA mas de 100 usos, elaborado a mano en Espana.",
    ],
    "limpiador-facial-rosa-mosqueta": [
        "REGENERA la piel y estimula la produccion natural de colageno.",
        "ANTIARRUGAS natural, rico en vitaminas C y E antioxidantes.",
        "IDEAL para piel seca o madura, unifica el tono.",
        "PH semejante al de la piel, sin SCI ni SLS.",
        "ECOLOGICO y solido, dura mas de 100 usos, hecho en Espana.",
    ],
    "espuma-depilacion-aloe": [
        "HIDRATA y calma la piel tras el rasurado con aloe vera canario.",
        "FACILITA el deslizar de la cuchilla con una crema espumosa.",
        "NUTRE con manteca de karite y cacao, protegiendo la piel.",
        "VEGANA, 98% ingredientes naturales, sin SLS ni SCI.",
        "SOLIDA y cero residuos, elaborada a mano una a una.",
    ],
    "espuma-depilacion-uva": [
        "HIDRATA y nutre la piel con aceite de pepita de uva.",
        "FACILITA el deslizar de la cuchilla con una crema espumosa.",
        "PROTEGE con manteca de karite y cacao, reduciendo la sequedad.",
        "VEGANA, 98% ingredientes naturales, sin SLS ni SCI.",
        "SOLIDA y cero residuos, con aroma a frutos rojos.",
    ],
    "champu-barba-carbon": [
        "CAPTURA y neutraliza el mal olor del pelo sin enmascararlo.",
        "CARBON activado desintoxicante que regula el exceso de grasa.",
        "IDEAL para barba y cabello, con aroma a eucalipto refrescante.",
        "VEGANO y sostenible, sin SLS ni SCI, cero residuos plasticos.",
        "DURA mas de 60 lavados, elaborado a mano en frio.",
    ],
})
