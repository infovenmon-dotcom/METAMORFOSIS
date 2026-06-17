# -*- coding: utf-8 -*-
"""Contenido enriquecido por producto (handle -> campos).

Fuentes:
  - Productos detallados en el catalogo de marca (data/SAVIA_DE_ALMA_catalogo.pdf):
    descripcion (parrafo de beneficios), modo de uso (ritual) y lema (✨).
  - Productos no incluidos en el catalogo: copy redactado a partir de los
    ingredientes y caracteristicas declaradas en el CSV.

Campos:
  descripcion : para que es bueno / beneficio principal.
  indicado    : tipo de piel/cabello o uso recomendado ("ideal para...").
  modoUso     : recomendaciones de uso / modo de empleo.
  lema        : frase de cierre de marca.
"""

CONTENT = {
    # ---------------- JABONES ----------------
    "jabon-karite": {
        "descripcion": "La manteca de karite es un tesoro ancestral para el cuidado de la piel. Rica en acidos grasos esenciales y vitaminas A, D, E y F, repara, nutre y fortalece la barrera cutanea, aportando elasticidad y confort inmediato.",
        "indicado": "Ideal para pieles secas, sensibles o que buscan un mimo profundo.",
        "modoUso": "Humedece el jabon y frotalo entre tus manos hasta generar una espuma rica y blanca. Aplica con movimientos circulares sobre el cuerpo y aclara con agua tibia.",
        "lema": "Hay dias que piden abrigo. El karite te lo da, en forma de caricia y calma.",
    },
    "jabon-rosa-mosqueta": {
        "descripcion": "La rosa mosqueta es un poderoso regenerador cutaneo, rica en acidos grasos esenciales y vitamina A. Estimula la renovacion celular y mejora la elasticidad de la piel, ayudando a reducir cicatrices, manchas y signos de la edad.",
        "indicado": "Ideal para pieles maduras, con manchas o que buscan regeneracion y firmeza.",
        "modoUso": "Aplica el jabon directamente sobre la piel humeda. Deja que su espuma cremosa limpie con suavidad, renovando la piel sin resecarla.",
        "lema": "Toda belleza es memoria. Y a veces, solo hace falta recordarla.",
    },
    "jabon-arbol-te": {
        "descripcion": "El aceite de arbol de te es conocido por sus propiedades antibacterianas y purificantes. Limpia en profundidad y equilibra el exceso de sebo.",
        "indicado": "Ideal para pieles mixtas o con tendencia grasa y acneica.",
        "modoUso": "Usa el jabon por la manana para activar cuerpo y mente. Disfruta de su espuma ligera y su efecto refrescante sobre la piel.",
        "lema": "La limpieza tambien puede ser una forma de despertar.",
    },
    "jabon-pepita-uva": {
        "descripcion": "El aceite y extracto de pepita de uva aportan resveratrol, un potente antioxidante natural que combate los radicales libres y rejuvenece la piel.",
        "indicado": "Ideal para revitalizar pieles apagadas, grasas o expuestas al sol.",
        "modoUso": "Aplica el jabon por la manana y deja que su espuma despierte cuerpo y mente. Tu piel queda limpia, luminosa y llena de vida.",
        "lema": "La piel tambien puede renacer, como la vid que vuelve a florecer cada ano.",
    },
    "jabon-lavanda": {
        "descripcion": "La lavanda calma la mente, relaja la piel y favorece un descanso reparador.",
        "indicado": "Ideal para la ducha nocturna, pieles sensibles y momentos de relax.",
        "modoUso": "Usa este jabon antes de dormir. Frota entre tus manos, deja que el aroma inunde el aire y siente como el estres se disuelve.",
        "lema": "Cada ducha puede ser una noche estrellada.",
    },
    "jabon-monoi": {
        "descripcion": "El aceite de Monoi, originario de Tahiti, combina aceite de coco y flor de tiare. Aporta suavidad, brillo y un aroma envolvente de verano eterno.",
        "indicado": "Ideal para hidratar y perfumar la piel con un aroma floral exotico.",
        "modoUso": "Aplica el jabon sobre la piel humeda y masajea lentamente. Siente la textura fundente y el aroma que te transporta a playas tranquilas.",
        "lema": "Cuidar tu piel tambien puede ser una forma de viajar.",
    },
    "jabon-aguacate": {
        "descripcion": "El aceite de aguacate hidrata y regenera profundamente, aportando suavidad y elasticidad a la piel.",
        "indicado": "Ideal para piel seca o madura que necesita nutricion intensa.",
        "modoUso": "Utilizalo en momentos en los que necesites calma y nutricion. Aplicalo con mimo y deja que la piel absorba su suavidad natural.",
        "lema": "La naturaleza sabe lo que tu piel necesita.",
    },
    "jabon-argan": {
        "descripcion": "El aceite de argan, rico en vitamina E y antioxidantes, nutre en profundidad y devuelve el brillo a la piel apagada. Combate la sequedad, la tirantez y los signos del envejecimiento.",
        "indicado": "Ideal tras la exposicion solar, en estaciones frias y para pieles con signos de edad.",
        "modoUso": "Usa el jabon en duchas templadas. Masajea la piel lentamente y siente como recupera su elasticidad y vitalidad natural.",
        "lema": "El brillo mas puro no viene del oro, sino de la piel que vuelve a respirar.",
    },
    "jabon-carbon-activo": {
        "descripcion": "El carbon activo actua como un iman natural que absorbe toxinas, impurezas y exceso de grasa.",
        "indicado": "Ideal para pieles mixtas o acneicas que buscan equilibrio y frescor duradero.",
        "modoUso": "Humedece el jabon y deja que su espuma haga su magia sobre rostro y cuerpo. Perfecto para rutinas de noche o despues de un dia intenso.",
        "lema": "Purificar no es borrar, es volver a tu esencia.",
    },
    "jabon-azufre": {
        "descripcion": "El azufre, mineral de la tierra, tiene propiedades antibacterianas, calmantes y purificantes. Ayuda a equilibrar el exceso de grasa y a aliviar irritaciones o impurezas.",
        "indicado": "Ideal para pieles con tendencia acneica, seborreica o sensible.",
        "modoUso": "Aplica suavemente con agua tibia, deja actuar unos segundos y aclara. Su efecto es visible desde los primeros usos.",
        "lema": "Cuando la tierra sana, tambien lo hace tu piel.",
    },
    "jabon-cbd": {
        "descripcion": "El CBD es un calmante y antiinflamatorio natural que ayuda a reducir rojeces e irritaciones. Combinado con aceite de oliva, ofrece una hidratacion profunda y reconfortante.",
        "indicado": "Ideal para pieles sensibles, reactivas o con tendencia a la irritacion.",
        "modoUso": "Humedece el jabon y aplica su espuma con movimientos suaves sobre rostro o cuerpo. Aclara con agua tibia. Apto para uso diario.",
        "lema": "Calma que nace de la planta, cuidado que se siente en la piel.",
    },
    "jabon-naranja-canela": {
        "descripcion": "La naranja, energizante y antiseptica, se une a la canela para revitalizar la piel con un calido aroma citrico y especiado. El aceite de oliva aporta hidratacion profunda.",
        "indicado": "Ideal para una limpieza energizante diaria y pieles normales.",
        "modoUso": "Frota el jabon sobre la piel humeda hasta crear espuma. Masajea, disfruta de su aroma y aclara con agua tibia.",
        "lema": "Un despertar citrico que enciende los sentidos.",
    },
    "jabon-borraja": {
        "descripcion": "La borraja, rica en acidos grasos esenciales, es un regenerador y antiinflamatorio natural que repara la piel. El aceite de oliva nutre e hidrata en profundidad.",
        "indicado": "Ideal para pieles maduras, secas o con eczemas y descamacion.",
        "modoUso": "Aplica el jabon sobre la piel humeda con movimientos circulares. Deja que su espuma nutra y aclara con agua tibia.",
        "lema": "La piel se regenera cuando la naturaleza la acompana.",
    },

    # ---------------- CHAMPUS ----------------
    "champu-cebolla-arcilla": {
        "descripcion": "El extracto de cebolla roja activa la microcirculacion capilar y fortalece los foliculos, estimulando el crecimiento natural del cabello. La arcilla roja elimina impurezas y exceso de grasa sin resecar.",
        "indicado": "Ideal contra la caida, para dar densidad y para cueros cabelludos con exceso de sebo.",
        "modoUso": "Humedece el cabello y frota la pastilla sobre el cuero cabelludo hasta crear espuma. Masajea con la yema de los dedos, deja actuar unos segundos y aclara con abundante agua.",
        "lema": "La fuerza nace de lo esencial: devuelve al cabello su poder natural.",
    },
    "champu-avena-almendra": {
        "descripcion": "El extracto de avena nutre en profundidad y refuerza la estructura del rizo, aportando elasticidad y evitando el encrespamiento. El aceite de almendras dulces hidrata y protege sin apelmazar.",
        "indicado": "Ideal para cabello rizado, ondulado o seco y cueros cabelludos sensibles.",
        "modoUso": "Humedece la pastilla y masajea el cuero cabelludo con movimientos circulares. Deja que la espuma envuelva el cabello y aclara con agua templada.",
        "lema": "Cada rizo guarda una historia, y la avena y la almendra la cuentan con dulzura.",
    },
    "champu-indigo-lavanda": {
        "descripcion": "El polvo de indigo neutraliza tonos amarillentos y reaviva el color, dejando un tono plateado o dorado mas puro. La lavanda calma el cuero cabelludo con una fragancia relajante.",
        "indicado": "Ideal para canas, rubios naturales y cabello sensible o de uso frecuente.",
        "modoUso": "Aplica la pastilla directamente sobre el cabello humedo. Masajea suavemente y aclara con agua fresca para potenciar el brillo.",
        "lema": "La belleza del blanco tambien merece su ritual.",
    },
    "champu-cafeina-canela": {
        "descripcion": "La cafeina activa la microcirculacion capilar, estimula el crecimiento y refuerza la raiz previniendo la caida. La canela tonifica y revitaliza el cuero cabelludo.",
        "indicado": "Ideal para cabellos finos o sin vida y como apoyo anticaida.",
        "modoUso": "Frota la pastilla sobre el cabello humedo hasta obtener espuma. Masajea el cuero cabelludo unos segundos, deja actuar y aclara.",
        "lema": "Cada manana, despierta tambien tu cabello.",
    },
    "champu-cade-enebro": {
        "descripcion": "El aceite de cade de enebro calma el picor y regula el exceso de sebo. Sus propiedades antisepticas y antifungicas ayudan a combatir la caspa y la irritacion.",
        "indicado": "Ideal para cueros cabelludos sensibles, con caspa, dermatitis o propensos a eccemas.",
        "modoUso": "Humedece el cabello, frota el champu entre las manos y aplica la espuma sobre el cuero cabelludo. Masajea lentamente y aclara.",
        "lema": "El bosque tambien sabe sanar.",
    },
    "champu-te-matcha": {
        "descripcion": "El te matcha, rico en polifenoles y clorofila, protege el cuero cabelludo de los radicales libres y regula el exceso de grasa, aportando pureza y frescor.",
        "indicado": "Ideal para uso diario, todo tipo de cabello y cueros cabelludos grasos.",
        "modoUso": "Frota la pastilla sobre el cabello humedo y masajea el cuero cabelludo. Aclara con agua templada.",
        "lema": "Cada espuma es un soplo verde de vida.",
    },
    "champu-cacao": {
        "descripcion": "El cacao aporta minerales y antioxidantes que revitalizan el cabello danado, mientras el karite hidrata y repara la fibra capilar de raiz a puntas.",
        "indicado": "Ideal para cabellos secos o castigados, tras el sol o el uso de planchas y secadores.",
        "modoUso": "Humedece el cabello, frota el champu entre las manos y masajea cuero cabelludo y medios. Deja actuar unos instantes y aclara.",
        "lema": "Tu cabello tambien merece renacer.",
    },
    "champu-betaina-sal": {
        "descripcion": "Combina la pureza de la sal marina con la suavidad de la betaina vegetal para limpiar en profundidad sin resecar, eliminando impurezas y exceso de grasa.",
        "indicado": "Ideal para cabellos grasos o con tendencia a perder volumen; uso frecuente.",
        "modoUso": "Humedece el cabello y frota suavemente la pastilla sobre el cuero cabelludo. Disfruta de su espuma aireada y aclara con agua templada.",
        "lema": "El mar tambien sabe limpiar el alma.",
    },
    "champu-romero-quina": {
        "descripcion": "El romero estimula la circulacion capilar, fortalece los foliculos y previene la caida. La quina regenera la fibra capilar promoviendo un crecimiento sano y vigoroso.",
        "indicado": "Ideal para cabellos finos, quebradizos o con tendencia a la caida.",
        "modoUso": "Frota la pastilla entre las manos o sobre el cabello humedo. Masajea lentamente el cuero cabelludo y aclara con agua templada.",
        "lema": "El romero y la quina devuelven al cabello su memoria de fuerza.",
    },
    "champu-barba-carbon": {
        "descripcion": "El carbon activo realiza una limpieza detox profunda que neutraliza olores e impurezas, mientras el aceite de coco nutre y suaviza la barba.",
        "indicado": "Ideal para la higiene y el cuidado diario de la barba.",
        "modoUso": "Frota la pastilla sobre la barba humeda hasta crear espuma. Masajea, deja actuar unos segundos y aclara. Apto para uso frecuente.",
        "lema": "Una barba limpia, suave y con caracter.",
    },

    # ---------------- DESODORANTES ----------------
    "desodorante-te-verde": {
        "descripcion": "Inspirado en la pureza del te verde, neutraliza el mal olor de forma natural sin bloquear los poros, permitiendo que la piel respire. Su formula cremosa hidrata y cuida.",
        "indicado": "Ideal para pieles sensibles y quienes buscan una fragancia ligera, sin aluminio ni alcohol.",
        "modoUso": "Aplica directamente sobre la piel limpia y seca de las axilas, con 2-3 pasadas suaves. Apto para uso diario.",
        "lema": "La verdadera frescura nace cuando la piel puede respirar.",
    },
    "desodorante-pomelo": {
        "descripcion": "El desodorante solido de pomelo aporta un frescor citrico, luminoso y estimulante. Su textura cremosa ofrece proteccion duradera sin obstruir los poros.",
        "indicado": "Ideal para empezar el dia con energia; proteccion natural sin aluminio.",
        "modoUso": "Aplica sobre la piel limpia y seca con 2-3 pasadas suaves. Deja absorber unos segundos.",
        "lema": "Una fragancia que despierta la alegria de vivir.",
    },
    "desodorante-algodon": {
        "descripcion": "El desodorante solido de algodon envuelve con una frescura delicada y un aroma empolvado y suave. Hidrata y protege sin irritar.",
        "indicado": "Ideal para pieles sensibles, post-depilacion y quienes buscan discrecion.",
        "modoUso": "Aplica sobre la piel limpia y seca con 2-3 pasadas suaves. Apto para piel sensible y uso diario.",
        "lema": "Aromas que no buscan destacar, sino acompanarte con la suavidad del alma.",
    },
    "desodorante-madera": {
        "descripcion": "El desodorante solido de madera concentra una esencia calida y amaderada. Con propiedades antioxidantes y purificantes, ofrece proteccion efectiva cuidando la piel.",
        "indicado": "Aroma amaderado unisex; ideal para una proteccion natural con caracter.",
        "modoUso": "Aplica sobre la piel limpia y seca con 2-3 pasadas suaves. Su textura cremosa se funde facilmente.",
        "lema": "En cada nota de madera habita la calma del bosque y la fuerza del origen.",
    },

    # ---------------- ACONDICIONADORES ----------------
    "acondicionador-coco": {
        "descripcion": "El aceite de coco nutre en profundidad y aporta brillo, el pantenol fortalece y la vitamina E protege como antioxidante natural. Desenreda y suaviza sin siliconas.",
        "indicado": "Ideal para cabello seco o encrespado que busca suavidad y brillo.",
        "modoUso": "Tras el champu, frota la pastilla sobre los medios y puntas del cabello humedo. Deja actuar 1-2 minutos y aclara.",
        "lema": "Suavidad de coco, brillo sin artificios.",
    },
    "acondicionador-almendra": {
        "descripcion": "El aceite de almendra define y nutre los rizos, la manteca de karite protege y repara, y la provitamina B5 hidrata y fortalece. Controla el frizz sin apelmazar.",
        "indicado": "Ideal para cabello rizado u ondulado que busca definicion y control del encrespamiento.",
        "modoUso": "Tras el champu, aplica la pastilla sobre medios y puntas del cabello humedo. Deja actuar 1-2 minutos y aclara.",
        "lema": "Rizos definidos, movimiento natural.",
    },

    # ---------------- LIMPIADORES FACIALES ----------------
    "limpiador-facial-rosa-mosqueta": {
        "descripcion": "La rosa mosqueta regenera y unifica el tono, aportando luminosidad. Limpia en profundidad sin resecar, respetando la piel.",
        "indicado": "Ideal para piel sensible y pieles que buscan luminosidad y regeneracion. Uso diario.",
        "modoUso": "Humedece la pastilla y crea una espuma suave entre las manos. Masajea el rostro con movimientos circulares y aclara con agua tibia.",
        "lema": "Luz para tu piel, cada manana.",
    },
    "limpiador-facial-aloe-pepino": {
        "descripcion": "El aloe vera hidrata y calma, mientras el pepino refresca y equilibra. Una limpieza facial suave que deja la piel fresca y confortable.",
        "indicado": "Ideal para pieles mixtas y normales; uso diario, manana y noche.",
        "modoUso": "Humedece la pastilla y crea espuma entre las manos. Masajea el rostro con movimientos circulares y aclara con agua tibia.",
        "lema": "Frescor que equilibra, calma que se nota.",
    },

    # ---------------- AFEITADO ----------------
    "espuma-afeitar-avellana": {
        "descripcion": "El aceite de avellana nutre y suaviza la piel mientras genera una espuma cremosa de larga duracion que facilita un apurado sin irritacion. Sin SLS ni SCI.",
        "indicado": "Ideal para un afeitado apurado y comodo, tambien en pieles sensibles. Uso diario.",
        "modoUso": "Frota la pastilla sobre la zona humeda hasta generar espuma (o emulsionala con brocha). Afeitate y aclara. Conserva en seco entre usos.",
        "lema": "Un afeitado cremoso, sin plastico y sin irritacion.",
    },

    # ---------------- DEPILACION ----------------
    "espuma-depilacion-uva": {
        "descripcion": "La pepita de uva, antioxidante y regeneradora, se une al aceite de coco y la manteca de karite para calmar e hidratar la piel tras la depilacion.",
        "indicado": "Ideal como cuidado post-depilacion para calmar e hidratar la piel.",
        "modoUso": "Tras la depilacion, frota la pastilla sobre la piel humeda y limpia hasta crear una espuma suave. Masajea y aclara.",
        "lema": "Calma antioxidante para tu piel despues de depilarte.",
    },
    "espuma-depilacion-aloe": {
        "descripcion": "El aloe vera refresca y calma la piel, mientras el aceite de coco y la manteca de karite hidratan y protegen. Pensada para el cuidado tras la depilacion.",
        "indicado": "Ideal para pieles sensibles como cuidado calmante post-depilacion.",
        "modoUso": "Tras la depilacion, frota la pastilla sobre la piel humeda y limpia hasta crear espuma. Masajea suavemente y aclara.",
        "lema": "Aloe que refresca y calma tras la depilacion.",
    },
}
