"""
CropLens AI - Agricultural Disease Knowledge Base

Comprehensive, authoritative agronomic knowledge base for all 38 crop pathology
and healthy classes recognized by the CropLens Stage 1 MobileNetV2 classifier.

Grounding References:
- USDA Agricultural Research Service (ARS) / USDA Plants Database
- University of California Integrated Pest Management (UC IPM)
- Cornell University College of Agriculture and Life Sciences (Cornell CALS)
- Purdue University Extension / Midwest Vegetable Production Guide
- Penn State Extension (Tree Fruit & Vegetable Production Guides)
- University of Florida IFAS Extension (EDIS)
- Iowa State University Extension and Outreach
- North Carolina State University Extension (NCSU Plant Pathology)
- FAO (Food and Agriculture Organization) Plant Production and Protection
- CABI Digital Library / Plantwise Knowledge Bank

IMPORTANT SAFETY & INTEGRITY RULES:
1. No invented chemical dosages or uncalibrated pesticide formulations.
2. Scientific categorization distinguishes Fungal, Bacterial, Viral, Oomycete, and Pest categories.
3. Healthy classes are explicitly handled as non-pathological crop tissue.
4. Unavailable or non-applicable fields are marked explicitly.
"""

from typing import Dict, Any, List, Optional

DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    # =========================================================================
    # APPLE (Malus domestica)
    # =========================================================================
    "Apple___Apple_scab": {
        "raw_class": "Apple___Apple_scab",
        "crop": "Apple",
        "disease_name": "Apple Scab",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Venturia inaequalis",
            "common_name": "Apple scab fungus (anamorph: Spilocaea pomi)",
            "taxonomic_order_family": "Venturiales: Venturiaceae",
        },
        "overview": (
            "Apple scab is one of the most serious fungal diseases of apple worldwide. "
            "It primarily affects leaves and fruit, causing olive-green to dark velvety lesions "
            "that lead to premature defoliation and corky, unmarketable fruit blemishes."
        ),
        "favorable_conditions": {
            "temperature_range": "15°C to 24°C (59°F to 75°F)",
            "humidity_moisture": "Continuous leaf wetness of 6 to 9+ hours during spring bud break and petal fall.",
            "soil_conditions": "Not soil-driven; primarily leaf canopy moisture and air humidity.",
            "key_triggers": [
                "Prolonged spring rains during green-tip through fruit development",
                "High relative humidity (>85%) in dense, unpruned canopies",
                "Overwintered leaf litter harboring pseudothecia on the orchard floor",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Olive-green to dull brown velvety spots on upper and lower leaf surfaces",
                "Lesion margins appear diffuse and feathery in early stages, becoming dark and distinct with age",
                "Heavily infected leaves turn yellow, curl, and drop prematurely in mid-summer",
            ],
            "stem_and_fruit_symptoms": [
                "Fruit develops dark, olive-green scabby circular lesions that become corky and cracked",
                "Early fruit infection causes severe distortion, asymmetric growth, and early fruit drop",
                "Twig lesions can occasionally occur on highly susceptible cultivars",
            ],
            "progression": "Primary airborne ascospores initiate spring infections; secondary conidia spread rapidly by rain splash across the tree canopy throughout summer.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne ascospores released from overwintered leaf litter during rain events",
                "Secondary conidia spread locally within canopy via splashing rain and wind-driven moisture",
            ],
            "survival_mechanism": "Overwinters as pseudothecia in fallen dead apple leaves on the orchard floor.",
        },
        "prevention_practices": [
            "Plant scab-resistant apple cultivars (e.g., Liberty, Freedom, Enterprise, Prima) where feasible.",
            "Mow fallen leaves in autumn or apply urea sprays to accelerate leaf decomposition and reduce ascospore inoculum.",
            "Prune annual shoots in winter to open tree canopies, maximizing sunlight penetration and rapid foliage drying.",
            "Avoid overhead sprinkler irrigation; maintain clean under-canopy ground cover.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Rake and remove or shred fallen leaves beneath infected trees before bud break.",
                "Prune dead and water-shoot wood to improve air movement.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative protectant sprays (such as wettable sulfur or copper formulations) at early bud swell according to university extension spray timing guides.",
                "Bio-fungicides based on Bacillus subtilis or potassium bicarbonate may provide suppression in organic orchards when applied preventatively before rain events.",
            ],
            "cautionary_dosage_note": (
                "Specific chemical dosages, re-entry intervals, and pre-harvest intervals must strictly adhere to EPA/local manufacturer labels and regional fruit extension spray guides. Do not apply uncalibrated mixtures."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered olive-colored lesions on fewer than 10% of leaves; minimal fruit damage. Controllable with canopy aeration and timely protectant sprays.",
            "severe": "Extensive coalescing lesions, canopy defoliation >25%, and cracked, deformed fruit. High risk of tree stress and substantial crop loss.",
            "not_explicitly_graded": "Single-stage classification in training data; presence confirmed without explicit mild/severe model grade.",
        },
        "professional_advice_triggers": [
            "More than 20% of spur leaves display active sporulating velvety lesions.",
            "Fruit lesions begin appearing prior to the second cover spray window.",
            "Fungicide resistance is suspected following standard protectant programs.",
        ],
        "sources": [
            {
                "title": "Apple Scab Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/apple/apple-scab/",
            },
            {
                "title": "Apple Scab (Venturia inaequalis)",
                "organization": "Cornell University CALS Tree Fruit Pathology",
                "url": "https://cals.cornell.edu/tree-fruit-pathology",
            },
        ],
    },

    "Apple___Black_rot": {
        "raw_class": "Apple___Black_rot",
        "crop": "Apple",
        "disease_name": "Black Rot (Frog-Eye Leaf Spot)",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Botryosphaeria obtusa",
            "common_name": "Black rot fungus (anamorph: Sphaeropsis malorum)",
            "taxonomic_order_family": "Botryosphaeriales: Botryosphaeriaceae",
        },
        "overview": (
            "Black rot is a common fungal disease of apple trees that causes three distinct injury phases: "
            "frog-eye leaf spots, limb cankers, and firm, dark rotting of mature fruit. "
            "It frequently enters through wounds caused by fire blight, winter freeze injury, or pruning cuts."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 27°C (68°F to 81°F)",
            "humidity_moisture": "Rainfall and standing surface moisture for 4 to 12 hours depending on ambient temperature.",
            "soil_conditions": "Not soil-driven; primarily branch bark condition and moisture.",
            "key_triggers": [
                "Unpruned dead wood and mummified fruit left hanging in the canopy",
                "Bark wounds from hail, mechanical pruning, or winter freezing",
                "Warm, rainy summer spells during fruit sizing",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small purple specks appearing on leaves shortly after petal fall",
                "Specks expand to circular spots (3-6 mm) with light tan or gray centers and distinct purple borders ('frog-eye' appearance)",
                "Severely affected leaves yellow and drop prematurely",
            ],
            "stem_and_fruit_symptoms": [
                "Sunken, reddish-brown bark cankers on limbs that gradually girdle branches",
                "Fruit rot typically initiates at the calyx end, developing alternating light and dark concentric zones",
                "Rotted fruit remains firm until completely dry, forming black, shriveled 'mummies'",
            ],
            "progression": "Inoculum from limb cankers or mummies washes down during rains onto nearby leaves and fruit, causing localized infection clusters.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Splashing rain and windblown water droplets distributing conidia from cankers and mummies",
                "Secondary wind dispersal of ascospores during warm rainy periods",
            ],
            "survival_mechanism": "Overwinters as pycnidia and perithecia in dead wood, branch cankers, and mummified apple fruit hanging in trees.",
        },
        "prevention_practices": [
            "Prune out dead wood, fire blight strikes, and diseased limbs 15 cm (6 inches) below visible canker margins.",
            "Remove all mummified apples from trees and orchard floor during winter sanitation.",
            "Avoid creating unnecessary bark gouges or mechanical wounds on main scaffold limbs.",
            "Maintain overall tree vigor through balanced fertilization; avoid excess nitrogen.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Prune during dormant season and destroy or burn prunings rather than leaving brush piles near the orchard.",
                "Hand-thin infected or wounded young fruit displaying early rot signs.",
            ],
            "biological_and_protectant_measures": [
                "Broad-spectrum protectant fungicides (such as captan or sulfur) applied from tight cluster through cover sprays as guided by regional extension schedules.",
            ],
            "cautionary_dosage_note": (
                "Refer to university agricultural extension schedules for registered fungicides and timings. Never invent chemical doses."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered frog-eye spots on foliage with no visible limb cankers or fruit rot. Sanitation and regular maintenance are sufficient.",
            "severe": "Active cankers girdling scaffold limbs or visible calyx-end rot on developing fruit. Requires immediate surgical pruning and protectant coverage.",
            "not_explicitly_graded": "Explicit mild/severe grading is not supported in the primary dataset for this class.",
        },
        "professional_advice_triggers": [
            "Major scaffold branches show advancing sunken cankers with papery bark peeling.",
            "Fruit rot exceeds 10% across the orchard block prior to harvest.",
        ],
        "sources": [
            {
                "title": "Black Rot of Apple",
                "organization": "Penn State Extension Tree Fruit Production Guide",
                "url": "https://extension.psu.edu/apple-disease-black-rot",
            },
            {
                "title": "Frog-Eye Leaf Spot and Black Rot",
                "organization": "University of Kentucky Cooperative Extension Service",
                "url": "https://plantpathology.ca.uky.edu/",
            },
        ],
    },

    "Apple___Cedar_apple_rust": {
        "raw_class": "Apple___Cedar_apple_rust",
        "crop": "Apple",
        "disease_name": "Cedar Apple Rust",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Gymnosporangium juniperi-virginianae",
            "common_name": "Cedar apple rust heteroecious rust fungus",
            "taxonomic_order_family": "Pucciniales: Pucciniaceae",
        },
        "overview": (
            "Cedar apple rust is a heteroecious fungal disease that requires both an apple (or crabapple) host "
            "and an alternate juniper host (Eastern red cedar, Juniperus virginiana) to complete its complex two-year life cycle. "
            "It causes bright yellow-orange lesions on apple leaves and fruit that reduce photosynthetic capacity."
        ),
        "favorable_conditions": {
            "temperature_range": "10°C to 24°C (50°F to 75°F)",
            "humidity_moisture": "Rainy spring weather that causes cedar galls to swell and discharge gelatinous spore horns.",
            "soil_conditions": "Not soil-dependent; driven by proximity of wild cedar/juniper trees.",
            "key_triggers": [
                "Presence of Eastern red cedar or ornamental junipers within 1 to 2 miles of apple orchards",
                "Warm spring rain events occurring between pink bud and petal fall",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Bright yellow-orange circular spots on the upper leaf surface in late spring",
                "Spots expand, develop reddish-brown dots (spermagonia) inside the orange center",
                "Small tubular projections or cluster cups (aecia) appear on the lower surface directly beneath the spots in mid-summer",
            ],
            "stem_and_fruit_symptoms": [
                "Fruit lesions are superficial, yellowish-orange, circular, and usually located near the calyx end",
                "Severe foliar infections cause heavy mid-summer leaf drop and reduced fruit sizing",
            ],
            "progression": "Gelatinous telial horns on cedar release basidiospores that infect apple foliage in spring; in late summer, apple leaf aecia release aeciospores that reinfect junipers.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown basidiospores carried from cedar galls to apple trees over distances up to 2-3 km (1-2 miles)",
                "Windblown aeciospores carrying the infection back from apple to juniper in July and August",
            ],
            "survival_mechanism": "Overwinters as perennial woody or gelatinous galls on twigs of Eastern red cedar and related junipers.",
        },
        "prevention_practices": [
            "Plant rust-resistant apple varieties (e.g., Enterprise, Freedom, Liberty, Redfree, William's Pride). Highly susceptible varieties include Honeycrisp, Rome, and Golden Delicious.",
            "Remove Eastern red cedar trees and wild junipers located within a 500-meter to 1-mile radius of the orchard where feasible.",
            "Scout nearby ornamental junipers in winter and prune off brown galls before spring rains.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Physically inspect and cut out cedar galls from adjacent windbreaks before they produce orange gelatinous horns in spring.",
            ],
            "biological_and_protectant_measures": [
                "Preventative protectant sprays applied from tight cluster through early cover sprays as recommended by regional extension spray guides.",
                "Immunizing protectants (e.g., sterol inhibitors or strobilurins registered for apple rusts) applied during wet spring spore release periods.",
            ],
            "cautionary_dosage_note": (
                "Follow product labels and agricultural extension fruit guides for legal fungicide applications. Never apply unregistered chemicals."
            ),
        },
        "severity_interpretation": {
            "mild": "Few scattered yellow spots on older leaves (<5% leaf area). Minimal impact on overall tree vitality.",
            "severe": "Widespread bright orange spotting with lower-leaf cluster cups on >25% of canopy foliage, leading to premature leaf drop and fruit blemishes.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Heavy defoliation occurs on commercially valuable cultivars early in the season.",
            "Fruit symptoms appear widely near the calyx end, threatening crop marketability.",
        ],
        "sources": [
            {
                "title": "Cedar Apple Rust",
                "organization": "Purdue University Extension Entomology & Plant Pathology",
                "url": "https://www.extension.purdue.edu/",
            },
            {
                "title": "Cedar Apple Rust on Fruit Crops",
                "organization": "Missouri Botanical Garden Plant Finder & IPM",
                "url": "https://www.missouribotanicalgarden.org/",
            },
        ],
    },

    "Apple___healthy": {
        "raw_class": "Apple___healthy",
        "crop": "Apple",
        "disease_name": "Healthy Apple Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy apple leaf tissue",
            "taxonomic_order_family": "None (Plantae: Rosaceae)",
        },
        "overview": (
            "The apple foliage displays clean, uniform green coloration without visible necrotic lesions, "
            "scab crusts, or fungal sporulation. The photosynthetic surface is fully intact and functioning normally."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 26°C (64°F to 79°F) optimal vegetative growth",
            "humidity_moisture": "Moderate relative humidity (50-70%) with good canopy airflow and well-drained orchard soil.",
            "soil_conditions": "Loamy, well-drained soil with pH 6.0 to 6.8 and balanced organic matter.",
            "key_triggers": ["Adequate sunlight, balanced soil nutrition, and routine preventative orchard management"],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Deep green, glossy upper leaf surfaces with smooth, intact serrated margins",
                "No chlorotic halos, rust pustules, or frog-eye spots",
                "Healthy leaf turgor and normal leaf development",
            ],
            "stem_and_fruit_symptoms": [
                "Stems smooth, bark intact without sunken cankers or gummy exudates",
                "Developing fruit smooth and free of corky blemishes",
            ],
            "progression": "Normal vegetative and fruit development under standard orchard management.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (non-pathological condition)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain annual dormant-season pruning to ensure air circulation and light penetration.",
            "Continue seasonal monitoring and weather-based scouting for early scab or rust pressure.",
            "Apply balanced fertilizer based on leaf tissue and soil tests; avoid excessive vegetative nitrogen.",
            "Maintain clean tree basins with proper mulch or controlled sod cover.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Regular orchard sanitation and ongoing scouting for pests like mites or aphids.",
            ],
            "biological_and_protectant_measures": [
                "No remedial treatment required. Continue standard preventative maintenance programs.",
            ],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy leaf tissue; 0% disease severity).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Scout regularly; seek guidance if sudden unexplained wilting or insect infestation appears.",
        ],
        "sources": [
            {
                "title": "Apple Orchard Integrated Pest Management",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/apple/",
            },
        ],
    },

    # =========================================================================
    # BLUEBERRY (Vaccinium corymbosum)
    # =========================================================================
    "Blueberry___healthy": {
        "raw_class": "Blueberry___healthy",
        "crop": "Blueberry",
        "disease_name": "Healthy Blueberry Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy blueberry leaf tissue",
            "taxonomic_order_family": "None (Plantae: Ericaceae)",
        },
        "overview": (
            "The blueberry foliage exhibits healthy vegetative characteristics with smooth, uniform green coloration, "
            "normal leaf turgor, and no signs of bacterial scorch, rust, or mummy berry blighting."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 25°C (64°F to 77°F)",
            "humidity_moisture": "Regular moisture with excellent drainage; blueberries are shallow-rooted and sensitive to waterlogging.",
            "soil_conditions": "Acidic soil with pH 4.5 to 5.2, rich in organic matter and well-drained.",
            "key_triggers": ["Acidic soil conditions, balanced ericaceous fertilizer, and uniform soil moisture."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Uniform green, elliptical leaves without marginal necrosis or interveinal chlorosis",
                "Absence of red leaf spots, stem cankers, or powdery fungal growth",
                "Healthy new shoot flushes with vigorous terminal growth",
            ],
            "stem_and_fruit_symptoms": ["Canes clean, green to reddish-brown, free of sunken lesions or mummified berries"],
            "progression": "Normal vegetative and berry development.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain soil pH in the acidic range (4.5 to 5.2) using elemental sulfur or acidifying organic amendments.",
            "Mulch bushes with 8 to 10 cm of aged pine bark or sawdust to retain moisture and suppress weeds.",
            "Prune older canes annually to stimulate vigorous new basal renewal shoots.",
            "Use drip irrigation to deliver consistent water directly to the root zone without wetting foliage.",
        ],
        "recommended_management": {
            "cultural_controls": ["Inspect bushes routinely during bloom and fruit set for early mummy berry or aphid activity."],
            "biological_and_protectant_measures": ["No chemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult local extension if foliage shows yellowing with green veins (iron chlorosis from high soil pH).",
        ],
        "sources": [
            {
                "title": "Highbush Blueberry Production Guide",
                "organization": "Michigan State University Extension",
                "url": "https://www.canr.msu.edu/blueberries/",
            },
        ],
    },

    # =========================================================================
    # CHERRY (Prunus cerasus / Prunus avium)
    # =========================================================================
    "Cherry_(including_sour)___Powdery_mildew": {
        "raw_class": "Cherry_(including_sour)___Powdery_mildew",
        "crop": "Cherry",
        "disease_name": "Powdery Mildew",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Podosphaera clandestina",
            "common_name": "Cherry powdery mildew fungus",
            "taxonomic_order_family": "Erysiphales: Erysiphaceae",
        },
        "overview": (
            "Powdery mildew of cherry is an obligate fungal disease affecting sweet and sour cherries. "
            "It primarily colonizes young leaves and ripening fruit, producing characteristic powdery white mycelial patches "
            "that cause foliar distortion, stunted shoot elongation, and unmarketable fruit blemishes."
        ),
        "favorable_conditions": {
            "temperature_range": "15°C to 27°C (59°F to 81°F)",
            "humidity_moisture": "High relative humidity at night combined with warm, dry daylight hours; free water on leaves actually inhibits conidial germination.",
            "soil_conditions": "Not soil-driven; favored by dense canopies and low air circulation.",
            "key_triggers": [
                "Shaded inner canopy microclimates with limited air movement",
                "Rapid flushes of tender succulent new leaves stimulated by high nitrogen",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Circular patches of white, talcum-like fungal growth on lower and upper leaf surfaces",
                "Leaves curl upward, cup, and become crinkled or brittle",
                "Heavily infected young shoots become stunted and distorted with white powdery coating",
            ],
            "stem_and_fruit_symptoms": [
                "Developing green fruit develops circular white powdery spots",
                "Infected fruit skin becomes russeted, sunken, and fails to color normally",
            ],
            "progression": "Primary infections occur from overwintered chasmothecia on the bark; airborne conidia spread secondary infections rapidly across new flushes.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne conidia carried long distances by wind currents under dry, breezy conditions",
                "Ascospores released from overwintering chasmothecia during spring irrigation or rain",
            ],
            "survival_mechanism": "Overwinters as chasmothecia (cleistothecia) lodged in bark crevices, pruning stubs, and leaf litter.",
        },
        "prevention_practices": [
            "Prune trees to open the canopy for maximum air circulation and direct sunlight penetration.",
            "Avoid over-application of nitrogen fertilizers that generate excessive succulent foliar flushes.",
            "Manage weed and root sucker growth under tree canopies to reduce relative humidity.",
            "Scout inner canopy water sprouts early in the season where mildew first establishes.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and prune infected water sprouts early in the spring before spores spread to the fruit cluster canopy.",
            ],
            "biological_and_protectant_measures": [
                "Preventative applications of sulfur, horticultural oils, or biological protectants (e.g., Bacillus amyloliquefaciens) applied early in the season as recommended by university spray programs.",
                "Note: Do not apply sulfur when temperatures exceed 30°C (85°F) or within 14 days of oil applications due to phytotoxicity.",
            ],
            "cautionary_dosage_note": (
                "Refer to university fruit extension schedules for specific registered materials, timing, and rates. Never exceed label maximums."
            ),
        },
        "severity_interpretation": {
            "mild": "Light powdery patches on a few terminal water shoots (<10% foliage). Readily managed with sucker removal and airflow improvements.",
            "severe": "Widespread leaf cupping across the fruiting canopy with powdery mycelium on green fruit. Requires immediate protectant intervention.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Foliar cupping and white mycelium appear on more than 25% of commercial fruiting spurs.",
            "Ripening fruit shows signs of webbing, russeting, or white powdery spots.",
        ],
        "sources": [
            {
                "title": "Cherry Powdery Mildew Pest Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/cherry/powdery-mildew/",
            },
            {
                "title": "Tree Fruit Pathology: Cherry Diseases",
                "organization": "Washington State University Extension",
                "url": "http://treefruit.wsu.edu/crop-protection/disease-management/cherry-powdery-mildew/",
            },
        ],
    },

    "Cherry_(including_sour)___healthy": {
        "raw_class": "Cherry_(including_sour)___healthy",
        "crop": "Cherry",
        "disease_name": "Healthy Cherry Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy cherry leaf tissue",
            "taxonomic_order_family": "None (Plantae: Rosaceae)",
        },
        "overview": (
            "The cherry foliage displays vibrant, healthy green coloration with smooth leaf blades, "
            "normal margins, and no visible fungal powdery coatings, shot-hole perforations, or leaf spot lesions."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 26°C (64°F to 79°F)",
            "humidity_moisture": "Moderate humidity with good orchard ventilation; deep, infrequent watering.",
            "soil_conditions": "Deep, well-drained loam or sandy loam with pH 6.0 to 7.0; cherries are very sensitive to wet feet.",
            "key_triggers": ["Adequate drainage, balanced nutrition, open pruning, and regular IPM scouting."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Uniform green foliage with normal serrated margins and natural leaf turgor",
                "Absence of yellowing, upward cupping, or powdery fungal growth",
                "Leaf glands at the petiole base appear clean and normal",
            ],
            "stem_and_fruit_symptoms": ["Bark intact without bacterial canker gummosis; fruit develops clean skin without russeting"],
            "progression": "Normal vegetative and reproductive growth.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Prune annually in late winter or early spring to maintain an open canopy architecture.",
            "Avoid sprinkler irrigation that wets the tree canopy.",
            "Maintain balanced fertility based on biennial soil and foliar analysis.",
        ],
        "recommended_management": {
            "cultural_controls": ["Continue routine seasonal scouting for aphids, mites, and shot-hole disease."],
            "biological_and_protectant_measures": ["No chemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": ["Consult extension if sudden gumming on trunks or branch dieback occurs."],
        "sources": [
            {
                "title": "Cherry Integrated Pest Management",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/cherry/",
            },
        ],
    },

    # =========================================================================
    # CORN / MAIZE (Zea mays)
    # =========================================================================
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "raw_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "crop": "Corn",
        "disease_name": "Gray Leaf Spot",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Cercospora zeae-maydis",
            "common_name": "Gray leaf spot fungus of maize",
            "taxonomic_order_family": "Mycosphaerellales: Mycosphaerellaceae",
        },
        "overview": (
            "Gray leaf spot is one of the most economically significant foliar diseases of corn in North America and globally. "
            "It produces distinct rectangular, vein-bounded lesions that destroy photosynthetic leaf area, leading to premature "
            "senescence, stalk lodging, and substantial yield loss when infection reaches the ear leaf around pollination."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 32°C (75°F to 90°F)",
            "humidity_moisture": "Extended periods of high relative humidity (>90%) and continuous leaf wetness of 11 to 13+ hours (heavy morning dew or fog).",
            "soil_conditions": "Continuous no-till corn production with abundant surface crop residue.",
            "key_triggers": [
                "Planting continuous corn without rotation",
                "Heavy surface residue from preceding corn crops",
                "Prolonged humid, overcast weather periods during and after tasseling",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Initial symptoms are small, tan circular spots with yellow halos",
                "Lesions expand linearly into elongated, rectangular, blocky brown-to-gray spots strictly restricted by secondary leaf veins (1 to 6 cm long)",
                "Entire leaves turn necrotic and dry out when lesions coalesce under high disease pressure",
            ],
            "stem_and_fruit_symptoms": [
                "Stalk cannibalization and increased lodging due to carbohydrate reallocation from stalks to filling ears",
                "Ears may display poor grain fill and chaffy kernels",
            ],
            "progression": "Infection starts on the lower leaves and progresses upward toward the ear leaf and upper canopy during warm, humid post-tasseling periods.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown conidia and rain splash originating from infested corn residue on the soil surface",
            ],
            "survival_mechanism": "Overwinters as fungal mycelium in corn crop debris on or above the soil surface.",
        },
        "prevention_practices": [
            "Plant corn hybrids with high genetic resistance ratings to gray leaf spot.",
            "Rotate fields out of corn for at least one to two years with non-host crops such as soybean or small grains.",
            "Incorporate residue where erosion management permits, accelerating microbial breakdown of infested stalks.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Scout fields starting two weeks prior to tasseling, focusing on lower leaves in low-lying, foggy field areas.",
            ],
            "biological_and_protectant_measures": [
                "Apply registered agricultural fungicides (e.g., strobilurin, triazole, or SDHI modes of action) between VT and R2 stages if disease is present on leaves below the ear leaf and weather favors spread.",
            ],
            "cautionary_dosage_note": (
                "Follow product label directions, pre-harvest intervals, and resistance management (FRAC rotation) protocols. Do not invent chemical rates."
            ),
        },
        "severity_interpretation": {
            "mild": "Lesions confined to lower canopy leaves below the ear leaf; upper leaves and ear leaf remain clean. Yield impact is minimal.",
            "severe": "Lesions reach the ear leaf and upper canopy at or shortly after pollination; extensive blighting. High risk of premature drydown and lodging.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Lesions are observed on the third leaf below the ear or higher prior to silking (R1).",
            "Hybrid planted is susceptible, weather forecast remains hot and humid, and yield potential justifies fungicide ROI.",
        ],
        "sources": [
            {
                "title": "Gray Leaf Spot of Corn",
                "organization": "Crop Protection Network (CPN)",
                "url": "https://cropprotectionnetwork.org/encyclopedia/gray-leaf-spot-of-corn",
            },
            {
                "title": "Corn Disease Management: Gray Leaf Spot",
                "organization": "Purdue University Extension",
                "url": "https://www.extension.purdue.edu/",
            },
        ],
    },

    "Corn_(maize)___Common_rust_": {
        "raw_class": "Corn_(maize)___Common_rust_",
        "crop": "Corn",
        "disease_name": "Common Rust",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Puccinia sorghi",
            "common_name": "Common corn rust fungus",
            "taxonomic_order_family": "Pucciniales: Pucciniaceae",
        },
        "overview": (
            "Common rust is a widespread foliar disease of field corn, sweet corn, and popcorn. "
            "It is recognized by oval-to-elongate cinnamon-brown pustules erupting across both upper and lower leaf surfaces. "
            "Unlike southern corn rust, common rust prefers moderate temperatures and is suppressed by sustained summer heat."
        ),
        "favorable_conditions": {
            "temperature_range": "16°C to 25°C (60°F to 77°F); inhibited when temperatures consistently exceed 30°C (86°F)",
            "humidity_moisture": "High relative humidity (>95%) and 6 or more hours of dew or free moisture on leaves.",
            "soil_conditions": "Not soil-driven; spores are blown into fields from southern regions.",
            "key_triggers": [
                "Early-season cool, damp, foggy periods",
                "Late-planted corn fields exposed to summer spore showers",
                "Susceptible sweet corn or seed corn inbred lines",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Circular to elongate golden-brown to cinnamon-brown pustules (uredinia) scattered across both leaf surfaces",
                "Pustules rupture the leaf epidermis, releasing powdery reddish-brown urediniospores when rubbed",
                "As plants mature, pustules turn dark brownish-black (teliospores)",
            ],
            "stem_and_fruit_symptoms": ["Severe leaf infection causes chlorosis, leaf tip burn, and reduced ear sizing in sweet corn"],
            "progression": "Airborne spores land on foliage; under cool, moist conditions, pustules erupt within 7-10 days and re-sporulate rapidly.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown urediniospores carried hundreds of miles northward on prevailing winds from tropical or subtropical regions each spring",
            ],
            "survival_mechanism": "Does not overwinter in temperate northern corn residue; requires living host tissue in warm southern climates.",
        },
        "prevention_practices": [
            "Plant resistant corn hybrids containing Rp resistance genes where rust is a recurring issue.",
            "Plant early in the season to allow the crop to pass critical grain-fill stages before peak spore migrations.",
        ],
        "recommended_management": {
            "cultural_controls": ["Scout sweet corn and seed production fields weekly from vegetative through blister stages."],
            "biological_and_protectant_measures": [
                "Field corn rarely requires chemical treatment as modern hybrids possess strong general resistance.",
                "In sweet corn or high-value seed crops, foliar fungicides may be applied if pustules appear on more than 6-10 leaves per plant before silking.",
            ],
            "cautionary_dosage_note": (
                "Refer to agricultural chemical labels and extension guides for spray thresholds. Avoid uncalibrated applications."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered pustules across lower leaves (<5% leaf coverage). Minimal risk of yield reduction in field corn.",
            "severe": "Dense, coalescing pustules on ear leaves and upper canopy (>20% coverage) causing premature leaf death in sweet corn or inbreds.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Sweet corn or seed corn canopy shows rapidly expanding pustules prior to the tassel stage.",
            "Pustules appear exclusively on upper leaf surfaces (suggesting possible Southern Rust, Puccinia polysora, which is far more damaging).",
        ],
        "sources": [
            {
                "title": "Common Rust of Corn",
                "organization": "Crop Protection Network (CPN)",
                "url": "https://cropprotectionnetwork.org/encyclopedia/common-rust-of-corn",
            },
            {
                "title": "Corn Disease Management: Rusts",
                "organization": "Iowa State University Extension and Outreach",
                "url": "https://crops.extension.iastate.edu/",
            },
        ],
    },

    "Corn_(maize)___Northern_Leaf_Blight": {
        "raw_class": "Corn_(maize)___Northern_Leaf_Blight",
        "crop": "Corn",
        "disease_name": "Northern Corn Leaf Blight",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Exserohilum turcicum",
            "common_name": "Northern corn leaf blight fungus (teleomorph: Setosphaeria turcica)",
            "taxonomic_order_family": "Pleosporales: Pleosporaceae",
        },
        "overview": (
            "Northern corn leaf blight (NCLB) is a destructive foliar disease of maize occurring in temperate and humid production areas. "
            "It produces long, elliptical, grayish-green or tan cigar-shaped lesions that can quickly blight entire leaves, "
            "severely curtailing photosynthesis during ear fill and predisposing stalks to rot."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 27°C (64°F to 81°F)",
            "humidity_moisture": "Extended leaf wetness (6 to 18 hours from rain, heavy dew, or overhead pivot irrigation) and moderate temperatures.",
            "soil_conditions": "Abundant surface residue in continuous no-till corn fields.",
            "key_triggers": [
                "Moderate, cloudy, rainy summer conditions",
                "Continuous corn rotations with high surface residue",
                "Planting susceptible hybrids lacking Ht resistance genes",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Long, elliptical, cigar-shaped grayish-green to tan lesions (2.5 to 15 cm long by 1 to 3 cm wide)",
                "Lesions are not restricted by leaf veins (unlike gray leaf spot)",
                "Under humid conditions, dark, olive-green fungal sporulation develops on the lesion surface",
                "In severe cases, lesions coalesce, blighting entire leaves prematurely",
            ],
            "stem_and_fruit_symptoms": [
                "Secondary stalk rot and lodging as the plant mobilizes stalk carbohydrates to compensate for lost leaf area",
                "Chaffy, lightweight ears with reduced kernel depth",
            ],
            "progression": "Initial lesions appear on lower canopy leaves; spores splash and blow upward, infecting ear and upper leaves during silking and grain fill.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Rain splash and windblown conidia originating from overwintered corn residue",
                "Long-distance transport of conidia by storm fronts and wind currents",
            ],
            "survival_mechanism": "Overwinters as conidia and chlamydospores in infected corn leaves and husks left on the soil surface.",
        },
        "prevention_practices": [
            "Select resistant hybrids with qualitative Ht genes (e.g., Ht1, Ht2, Ht3) or high quantitative multigenic tolerance.",
            "Rotate crops out of corn for at least one full growing season to allow crop residue to decay.",
            "Manage tillage to bury infested residue where soil conservation practices permit.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Scout fields prior to tasseling through early dough stage (VT to R3), inspecting leaves at and below the ear leaf.",
            ],
            "biological_and_protectant_measures": [
                "Apply registered fungicides (triazoles, strobilurins, or premixes) if lesions are present on or near the ear leaf at VT to R2 stage in susceptible hybrids when wet weather is forecast.",
            ],
            "cautionary_dosage_note": (
                "Adhere strictly to label application timings, rates, and harvest intervals. Do not apply unverified mixtures."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered cigar-shaped lesions on lower leaves only (<5% total leaf area). Minimal impact on grain yield.",
            "severe": "Extensive blighting on ear leaves and upper canopy (>25% leaf area affected) at or before the R2 blister stage. High yield loss risk.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Cigar-shaped lesions are detected on leaves at or above the ear level at or before tassel emergence (VT).",
            "Rapid lesion expansion occurs across more than 50% of the hybrid stand.",
        ],
        "sources": [
            {
                "title": "Northern Corn Leaf Blight",
                "organization": "Crop Protection Network (CPN)",
                "url": "https://cropprotectionnetwork.org/encyclopedia/northern-corn-leaf-blight",
            },
            {
                "title": "Corn Disease Guide: Northern Corn Leaf Blight",
                "organization": "Purdue University Extension",
                "url": "https://www.extension.purdue.edu/",
            },
        ],
    },

    "Corn_(maize)___healthy": {
        "raw_class": "Corn_(maize)___healthy",
        "crop": "Corn",
        "disease_name": "Healthy Corn Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy maize leaf tissue",
            "taxonomic_order_family": "None (Plantae: Poaceae)",
        },
        "overview": (
            "The corn foliage exhibits vigorous, healthy dark green coloration, broad intact leaf blades, "
            "and an absence of fungal lesions, rust pustules, or viral streaking. Photosynthetic efficiency is optimal."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 30°C (68°F to 86°F)",
            "humidity_moisture": "Adequate seasonal rainfall (500-800 mm) or irrigation, especially during the critical pollination and grain-fill window.",
            "soil_conditions": "Deep, fertile, well-drained loam or silt loam with pH 5.8 to 7.0 and adequate N-P-K nutrient availability.",
            "key_triggers": ["Balanced soil fertility, weed control, and appropriate hybrid selection."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Broad, uniform dark green leaf blades with strong, intact midribs",
                "No rectangular gray spots, cigar-shaped blights, or cinnamon-brown rust pustules",
                "Normal leaf arching without nitrogen deficiency V-shaped yellowing",
            ],
            "stem_and_fruit_symptoms": ["Stalks firm and green with strong brace roots; ears developing uniform silk and kernel rows"],
            "progression": "Normal vegetative and reproductive grain-fill development.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain balanced soil fertility guided by soil testing (N, P, K, and sulfur).",
            "Follow planned crop rotations (e.g., corn-soybean) to disrupt pest and pathogen cycles.",
            "Scout regularly from vegetative through dent stages to catch early pest pressure.",
        ],
        "recommended_management": {
            "cultural_controls": ["Standard agronomic crop management and timely weed control."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult an agronomist if nutrient deficiency patterns (interveinal striping or leaf-tip V-yellowing) emerge.",
        ],
        "sources": [
            {
                "title": "Corn Field Guide",
                "organization": "Iowa State University Extension and Outreach",
                "url": "https://store.extension.iastate.edu/product/Corn-Field-Guide",
            },
        ],
    },

    # =========================================================================
    # GRAPE (Vitis vinifera / Vitis labrusca)
    # =========================================================================
    "Grape___Black_rot": {
        "raw_class": "Grape___Black_rot",
        "crop": "Grape",
        "disease_name": "Black Rot",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Guignardia bidwellii",
            "common_name": "Grape black rot fungus (anamorph: Phyllosticta ampelicida)",
            "taxonomic_order_family": "Botryosphaeriales: Botryosphaeriaceae",
        },
        "overview": (
            "Grape black rot is one of the most destructive fungal diseases of cultivated grapes in warm, humid regions. "
            "It affects all green tissues of the vine, but fruit infection is devastating: berries rot rapidly, turn black, "
            "and shrivel into hard, wrinkled mummies that can destroy up to 80-100% of the crop if uncontrolled."
        ),
        "favorable_conditions": {
            "temperature_range": "21°C to 27°C (70°F to 80°F)",
            "humidity_moisture": "Continuous leaf wetness of 6 to 24 hours depending on temperature (infection occurs in 6 hours at 27°C).",
            "soil_conditions": "Not soil-driven; favored by dense canopies, humid air, and unpruned mummies.",
            "key_triggers": [
                "Frequent rain events during pre-bloom through 4-5 weeks post-bloom",
                "Mummified berries left hanging on trellises or sitting on the vineyard floor",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, circular reddish-brown leaf spots with distinct dark brown borders appearing in late spring",
                "Tiny, black pimple-like fruiting bodies (pycnidia) form in a ring inside the lesion center",
                "Leaves do not drop early, but lesions reduce active photosynthetic area",
            ],
            "stem_and_fruit_symptoms": [
                "Shoots and tendrils develop sunken, purple-to-black elongated cankers",
                "Berry infection starts as a small, light-brown circular spot; within 48-72 hours, the entire berry rots",
                "Infected berries shrivel into hard, wrinkled, coal-black mummies covered in pycnidia",
            ],
            "progression": "Ascospores from overwintered mummies infect young foliage in spring; conidia from leaf pycnidia splash onto berries during bloom and early fruit sizing.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown ascospores from overwintered mummies on the vineyard floor or trellis wire",
                "Secondary conidia spread via splashing rain droplets across the canopy",
            ],
            "survival_mechanism": "Overwinters primarily in mummified berries hanging on trellises or on the ground.",
        },
        "prevention_practices": [
            "Sanitation is the cornerstone of black rot control: remove and destroy all mummified clusters during winter pruning.",
            "Cultivate beneath the trellis before bud break to bury fallen mummies at least 5 cm deep.",
            "Practice canopy management (shoot thinning, leaf pulling) to ensure maximum airflow and sunlight exposure around clusters.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Drop and destroy infected clusters seen early in the season to prevent secondary conidial spread.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectant fungicides (e.g., mancozeb, captan, or registered DMI/strobilurin fungicides) starting at 1-3 inch shoot growth through 4 weeks post-bloom as guided by regional viticulture spray schedules.",
            ],
            "cautionary_dosage_note": (
                "Consult state viticulture extension guides for spray timings, legal rates, and pre-harvest intervals. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "A few isolated leaf lesions (<5% of leaves); berries remain green and clean. Managed by canopy aeration and standard protectant schedule.",
            "severe": "Widespread leaf spotting and berry clusters showing rapidly expanding brown rot or black shriveling. High risk of total cluster loss.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Black rot symptoms appear on fruit clusters prior to veraison.",
            "More than 15% of vineyard canopy displays active leaf pycnidia during bloom.",
        ],
        "sources": [
            {
                "title": "Black Rot of Grape",
                "organization": "Cornell University Cooperative Extension Viticulture",
                "url": "https://ecommons.cornell.edu/handle/1813/43084",
            },
            {
                "title": "Grape Disease Management: Black Rot",
                "organization": "Penn State Extension",
                "url": "https://extension.psu.edu/grape-disease-black-rot",
            },
        ],
    },

    "Grape___Esca_(Black_Measles)": {
        "raw_class": "Grape___Esca_(Black_Measles)",
        "crop": "Grape",
        "disease_name": "Esca (Black Measles)",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Phaeomoniella chlamydospora, Phaeoacremonium minimum, and Fomitiporia mediterranea",
            "common_name": "Esca / Grapevine trunk disease fungal complex",
            "taxonomic_order_family": "Calosphaeriales & Hymenochaetales (fungal complex)",
        },
        "overview": (
            "Esca (also known as Black Measles or Spanish Measles) is a complex, insidious grapevine trunk disease "
            "caused by a consortium of wood-decay fungi. It causes distinctive 'tiger-stripe' interveinal leaf scorch, "
            "dark purple spotting on berries, vascular wood necrosis, and in acute forms, sudden vine collapse (apoplexy)."
        ),
        "favorable_conditions": {
            "temperature_range": "22°C to 35°C (72°F to 95°F); foliar symptoms are triggered by hot summer weather following mild wet springs",
            "humidity_moisture": "Rainfall in dormant season promotes spore release; high evapotranspiration stress in summer triggers foliar symptoms.",
            "soil_conditions": "Water stress and poorly aerated soils exacerbate symptom expression.",
            "key_triggers": [
                "Large pruning wounds made during wet winter weather without wound protection",
                "Vine age (most common in vines older than 8 to 10 years)",
                "Severe summer heat waves stressing infected vascular trunks",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Interveinal yellowing (in white cultivars) or reddening (in red cultivars) that turns necrotic, leaving green margins along veins ('tiger-stripe' pattern)",
                "Severe symptoms cause scorched leaf margins, premature leaf drying, and defoliation",
                "Acute apoplexy form: sudden total wilting and drying of the entire vine within days during hot spells",
            ],
            "stem_and_fruit_symptoms": [
                "Fruit develops small, round, dark-brown to purple spots scattered across the berry skin ('black measles')",
                "Cross-section of trunk or cordons reveals dark brown vascular streaking and spongy, white/yellow wood rot in the core",
            ],
            "progression": "Fungi colonize through pruning wounds into the wood over years; phytotoxic metabolites produced in trunk cankers translocate to foliage and fruit during summer heat.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne and water-splashed spores entering open pruning wounds during dormant and spring periods",
                "Infected nursery planting material (graft unions)",
            ],
            "survival_mechanism": "Survives perennially inside the woody tissue, trunk cankers, and dead grapevine wood.",
        },
        "prevention_practices": [
            "Delay pruning until late in the dormant season (late winter) when wounds heal more rapidly and spore counts are lower.",
            "Apply wound protectants (e.g., registered paints, pastes, or biological Trichoderma formulations) to large cuts immediately after pruning.",
            "Avoid making large flush cuts on main trunks; double-pruning can reduce infection of permanent wood.",
            "Remove and burn dead grapevines and diseased cordon wood; do not leave pruned dead trunks in vineyard rows.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Trunk renewal: retrain a healthy basal sucker from below the trunk canker to replace a chronically symptomatic vine.",
                "Remedial surgery: excise infected cordons 10 cm below internal wood discoloration.",
            ],
            "biological_and_protectant_measures": [
                "No post-infection curative chemical spray exists for foliar symptoms since the pathogen resides deep within the trunk wood.",
                "Protect pruning wounds preventatively with registered fungicides or biocontrol agents.",
            ],
            "cautionary_dosage_note": (
                "No chemical sprays cure established wood rot. Do not apply unapproved foliar chemicals attempting to cure Esca."
            ),
        },
        "severity_interpretation": {
            "mild": "Few scattered leaves show tiger-stripe pattern on a single cordon; berries unaffected. Vine can remain productive with trunk renewal.",
            "severe": "Widespread canopy scorch, fruit measles across multiple clusters, or apoplectic vine collapse. Significant wood rot requiring vine replacement.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Sudden apoplectic collapse of vines occurs during mid-summer.",
            "More than 5-10% of vineyard block exhibits severe fruit measles and tiger-striping.",
        ],
        "sources": [
            {
                "title": "Grape: Esca (Black Measles)",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/grape/esca-black-measles/",
            },
            {
                "title": "Grapevine Trunk Diseases: Esca Complex",
                "organization": "Ontario Ministry of Agriculture, Food and Rural Affairs",
                "url": "https://www.ontario.ca/",
            },
        ],
    },

    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "raw_class": "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "crop": "Grape",
        "disease_name": "Leaf Blight (Isariopsis Leaf Spot)",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Pseudocercospora cladosporioides",
            "common_name": "Grape leaf blight fungus (syn. Isariopsis clavispora, Phaeoisariopsis clavispora)",
            "taxonomic_order_family": "Mycosphaerellales: Mycosphaerellaceae",
        },
        "overview": (
            "Grape leaf blight (Isariopsis leaf spot) is a foliar fungal disease that causes necrotic leaf spotting "
            "and late-season blighting, primarily in warm, humid sub-tropical and tropical viticultural areas. "
            "Under severe conditions, it causes premature defoliation that impedes berry sugar accumulation and weakens overwintering canes."
        ),
        "favorable_conditions": {
            "temperature_range": "22°C to 30°C (72°F to 86°F)",
            "humidity_moisture": "High relative humidity (>80%) and intermittent rainfall or overhead irrigation wetting foliage for 8+ hours.",
            "soil_conditions": "Not soil-driven; exacerbated by dense vine canopies and poor ventilation.",
            "key_triggers": [
                "Warm, rainy late summer and post-harvest spells",
                "Overcrowded canopies with excessive leaf layering",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Irregular, angular to circular necrotic brown-to-black spots on older lower leaves",
                "Lesion margins are often defined by a dark reddish-brown border with a surrounding chlorotic halo",
                "Dark olivaceous-brown velvety fungal sporulation (conidiophores) develops on the lesion underside during humid weather",
                "Lesions coalesce, causing large blighted leaf sections that curl and drop prematurely",
            ],
            "stem_and_fruit_symptoms": [
                "Primarily foliar; stems and berries are rarely infected directly",
                "Premature defoliation exposes clusters to sunburn and reduces berry Brix levels",
            ],
            "progression": "Infection begins on basal, older leaves in mid-season and progresses upward as the canopy matures.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown conidia and splashing rain droplets from fallen infected leaves",
            ],
            "survival_mechanism": "Overwinters as dormant stroma in fallen leaf litter and on cane bark crevices.",
        },
        "prevention_practices": [
            "Implement thorough canopy management: shoot positioning, suckering, and basal leaf pulling around fruit zones to enhance air drying.",
            "Rake or cultivate beneath vines after leaf fall to bury fallen infected foliage.",
            "Avoid overhead irrigation; utilize drip irrigation systems.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Promote good air movement through summer canopy thinning and pruning.",
            ],
            "biological_and_protectant_measures": [
                "Standard post-bloom vineyard fungicide programs targeting downy mildew and powdery mildew (e.g., copper protectants, strobilurins) generally provide concurrent suppression.",
            ],
            "cautionary_dosage_note": (
                "Follow product label directions and local extension spray schedules. Do not apply unregistered chemicals."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered spots on lower basal leaves only; canopy remains intact. No significant impact on fruit quality.",
            "severe": "Widespread leaf blighting across more than 30% of the canopy with early defoliation before harvest. Threatens fruit maturation.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Extensive foliar blighting and premature leaf drop occur prior to fruit veraison.",
        ],
        "sources": [
            {
                "title": "Grape Leaf Blight Management",
                "organization": "FAO Plant Production and Protection Guidelines",
                "url": "https://www.fao.org/agriculture/",
            },
            {
                "title": "Foliar Diseases of Grapevines",
                "organization": "Texas A&M AgriLife Extension",
                "url": "https://aggie-horticulture.tamu.edu/",
            },
        ],
    },

    "Grape___healthy": {
        "raw_class": "Grape___healthy",
        "crop": "Grape",
        "disease_name": "Healthy Grape Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy grapevine leaf tissue",
            "taxonomic_order_family": "None (Plantae: Vitaceae)",
        },
        "overview": (
            "The grapevine foliage exhibits healthy, uniform green coloration with well-formed lobes, "
            "clean leaf margins, and an absence of powdery patches, black rot lesions, or tiger-stripe necrosis."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 28°C (64°F to 82°F)",
            "humidity_moisture": "Moderate relative humidity with ample sunlight and good canopy ventilation.",
            "soil_conditions": "Well-drained gravelly or sandy loam with pH 6.0 to 7.0 and moderate fertility.",
            "key_triggers": ["Careful canopy management, regulated deficit irrigation, and routine IPM scouting."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Broad, uniform green leaf blades with normal lobing and intact veins",
                "No water-soaked spots, oil spots, or velvety sporulation on the underside",
                "Normal leaf turgor and healthy shoot tip growth",
            ],
            "stem_and_fruit_symptoms": ["Canes clean without cankers; clusters set uniformly with smooth, unblemished berries"],
            "progression": "Normal vegetative and reproductive growth through veraison and harvest.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain trellis shoot training and summer leaf pulling to sustain canopy ventilation.",
            "Protect pruning cuts during dormant season to prevent trunk disease entry.",
            "Monitor soil moisture with sensors to optimize deficit irrigation timing.",
        ],
        "recommended_management": {
            "cultural_controls": ["Regular vineyard scouting for pests such as leafhoppers, mites, and early mildew."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult viticulture specialist if sudden viral fanleaf degeneration or leafroll symptoms appear.",
        ],
        "sources": [
            {
                "title": "Grape Pest Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/grape/",
            },
        ],
    },

    # =========================================================================
    # ORANGE / CITRUS (Citrus sinensis)
    # =========================================================================
    "Orange___Haunglongbing_(Citrus_greening)": {
        "raw_class": "Orange___Haunglongbing_(Citrus_greening)",
        "crop": "Orange",
        "disease_name": "Huanglongbing (Citrus Greening)",
        "is_healthy": False,
        "category": "Bacterial",
        "causative_pathogen": {
            "scientific_name": "Candidatus Liberibacter asiaticus",
            "common_name": "Citrus greening bacterium (phloem-limited)",
            "taxonomic_order_family": "Rhizobiales: uncultured phloem-limited alphaproteobacteria",
        },
        "overview": (
            "Huanglongbing (HLB, or Citrus Greening) is considered the most devastating disease of citrus worldwide. "
            "Caused by a fastidious, phloem-limited bacterium transmitted by the Asian citrus psyllid, "
            "it starves the tree's root system, causes asymmetric blotchy leaf mottle, yields lopsided bitter fruit, "
            "and eventually kills the tree within 3 to 5 years."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 30°C (68°F to 86°F) promotes vector Asian citrus psyllid reproduction and flight activity",
            "humidity_moisture": "Not moisture-dependent; vector population dynamics drive spread.",
            "soil_conditions": "Tree decline is accelerated by soil salinity and root stress.",
            "key_triggers": [
                "Presence of Asian citrus psyllid (Diaphorina citri) vector populations",
                "Movement of uncertified nursery stock or infected budwood across quarantine boundaries",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Asymmetric 'blotchy mottle': irregular yellowing that crosses leaf veins unequally on either side of the midrib",
                "Vein corking, yellowing, and enlargement",
                "Distinct upright, small leaves with zinc-deficiency-like symptoms ('rabbit ears')",
                "Yellow shoot flushes standing out against an otherwise green canopy",
            ],
            "stem_and_fruit_symptoms": [
                "Fruit remains small, lopsided, and fails to color normally (retains green color at the stylar end)",
                "Fruit tastes sour, bitter, and contains aborted, dark seeds",
                "Heavy premature fruit drop; progressive branch dieback and root system death",
            ],
            "progression": "Bacteria replicate in phloem sieve tubes, plugging nutrient flow; root dieback precedes severe canopy decline.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Asian citrus psyllid (Diaphorina citri) feeding on phloem sap and transmitting the bacterium persistently",
                "Grafting and propagation with infected budwood",
            ],
            "survival_mechanism": "Survives exclusively within host plant phloem sieve tubes and within the insect vector body.",
        },
        "prevention_practices": [
            "Plant only certified disease-free citrus trees sourced from state-inspected insect-proof nurseries.",
            "Aggressively monitor and suppress Asian citrus psyllid populations using area-wide IPM programs.",
            "Do not transport citrus plant material, leaves, or backyard clippings outside of quarantine areas.",
            "Promptly identify and remove infected trees in low-prevalence regions to eliminate inoculum sources.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and destroy confirmed HLB-positive trees in commercial groves where eradication is feasible.",
                "In endemic areas, intensive foliar nutritional programs and slow-release root feeding help sustain tree productivity temporarily.",
            ],
            "biological_and_protectant_measures": [
                "Release biological control parasitoid wasps (Tamarixia radiata) to suppress psyllid populations in residential and organic groves.",
                "Vector management: apply registered insecticides targeting adult and nymph psyllids during flush cycles.",
            ],
            "cautionary_dosage_note": (
                "There is no approved chemical cure for the bacterium itself in field trees. Psyllid control must strictly adhere to state agricultural commissioner rules."
            ),
        },
        "severity_interpretation": {
            "mild": "Early blotchy mottle restricted to one or two shoots on a single scaffold limb. Immediate testing and vector containment required.",
            "severe": "Widespread blotchy mottle, extensive yellow shoot dieback, and small lopsided fruit across the entire tree. High decline stage.",
            "not_explicitly_graded": "Single-stage classification in training data; presence confirmed.",
        },
        "professional_advice_triggers": [
            "Any suspected blotchy mottle crossing the midvein must be reported immediately to state/local agricultural authorities for PCR testing.",
            "Asian citrus psyllids with waxy honeydew secretions are observed on young leaf flushes.",
        ],
        "sources": [
            {
                "title": "Citrus Greening (Huanglongbing) Information",
                "organization": "USDA Animal and Plant Health Inspection Service (APHIS)",
                "url": "https://www.aphis.usda.gov/plant-pests-diseases/citrus-diseases/hlb",
            },
            {
                "title": "Citrus: Huanglongbing (Citrus Greening)",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/citrus/huanglongbing-citrus-greening/",
            },
            {
                "title": "Citrus Greening (Huanglongbing)",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/",
            },
        ],
    },

    # =========================================================================
    # PEACH (Prunus persica)
    # =========================================================================
    "Peach___Bacterial_spot": {
        "raw_class": "Peach___Bacterial_spot",
        "crop": "Peach",
        "disease_name": "Bacterial Spot",
        "is_healthy": False,
        "category": "Bacterial",
        "causative_pathogen": {
            "scientific_name": "Xanthomonas arboricola pv. pruni",
            "common_name": "Bacterial spot of stone fruit",
            "taxonomic_order_family": "Xanthomonadales: Xanthomonadaceae",
        },
        "overview": (
            "Bacterial spot is a major disease of peaches, nectarines, and plums, especially in regions with sandy soils "
            "and frequent spring rainfall. It causes water-soaked angular leaf lesions that drop out to create a 'shot-hole' appearance, "
            "extensive early defoliation, twig cankers, and deep fruit pitting that reduces market value."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 30°C (75°F to 86°F)",
            "humidity_moisture": "Frequent rains, heavy dews, and high winds that blow rain and abrasive sand particles into stomata and wounds.",
            "soil_conditions": "Light, sandy soils prone to windblown abrasion heighten infection severity.",
            "key_triggers": [
                "Warm, wet, windy spring weather during shuck split and fruit sizing",
                "Sandy orchard soils producing abrasive windblown sand",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, angular, water-soaked spots (1-3 mm) on leaves, concentrated near the tip and midrib",
                "Spots turn dark purple, brown, or black; necrotic centers frequently drop out, creating a 'shot-hole' appearance",
                "Infected leaves turn yellow and drop prematurely, often starting from the base of the shoots",
            ],
            "stem_and_fruit_symptoms": [
                "Spring cankers on young twigs appear as dark water-soaked blisters that can girdle shoots",
                "Fruit develops small olive-brown spots that crack, exude gum, and become deeply pitted as fruit sizes",
            ],
            "progression": "Bacteria overwinter in twig cankers; spring rains splash bacteria into leaf stomata and fruit lenticels.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Wind-driven rain splash carrying bacterial cells from overwintered twig cankers to new foliage",
                "Pruning tools transmitting bacteria during wet dormant pruning",
            ],
            "survival_mechanism": "Overwinters in twig cankers, bud scales, and leaf scars formed during the previous autumn.",
        },
        "prevention_practices": [
            "Plant resistant peach cultivars (e.g., Clayton, Candor, Harrow Beauty, Biscoe, Reliance). Highly susceptible varieties like O'Henry require intensive care.",
            "Establish sod or cover crops between tree rows to prevent windblown sand abrasion of delicate spring foliage.",
            "Avoid excessive nitrogen fertilization that promotes late-season vegetative growth vulnerable to cankers.",
            "Maintain shelterbelts or windbreaks around orchards in sandy coastal or plains areas.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Prune out dead shoots and obvious spring twig cankers during dry weather.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative copper bactericide sprays at dormant season / leaf fall to reduce overwintering populations.",
                "In-season low-rate copper formulations or oxytetracycline sprays applied from petal fall through cover sprays in accordance with university extension spray advisories.",
            ],
            "cautionary_dosage_note": (
                "Peach foliage is extremely sensitive to copper phytotoxicity under cool, slow-drying conditions. Follow extension rate guidelines precisely."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered shot-hole lesions on fewer than 10% of leaves; fruit unblemished. Manageable with windbreak maintenance and copper sanitation.",
            "severe": "Severe leaf drop (>30% defoliation), extensive fruit pitting, and active twig cankers. High yield and tree vigor impact.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Defoliation exceeds 20% on commercially bearing peach trees before pit hardening.",
            "Fruit exhibits extensive cracking and gumming across more than 10% of the crop.",
        ],
        "sources": [
            {
                "title": "Bacterial Spot of Peach",
                "organization": "North Carolina State University Extension",
                "url": "https://content.ces.ncsu.edu/bacterial-spot-of-peach",
            },
            {
                "title": "Peach Diseases: Bacterial Spot",
                "organization": "Penn State Extension Tree Fruit Production Guide",
                "url": "https://extension.psu.edu/peach-disease-bacterial-spot",
            },
        ],
    },

    "Peach___healthy": {
        "raw_class": "Peach___healthy",
        "crop": "Peach",
        "disease_name": "Healthy Peach Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy peach leaf tissue",
            "taxonomic_order_family": "None (Plantae: Rosaceae)",
        },
        "overview": (
            "The peach foliage displays vibrant, uniform green coloration, smooth lanceolate leaf blades, "
            "and intact margins with no shot-hole perforations, leaf curling (Taphrina), or bacterial cankers."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 28°C (68°F to 82°F)",
            "humidity_moisture": "Moderate relative humidity with good airflow and regular deep soil watering.",
            "soil_conditions": "Well-drained sandy loam or loam with pH 6.0 to 6.8; peaches do not tolerate wet, waterlogged soils.",
            "key_triggers": ["Adequate chilling hours, balanced fertility, and open vase pruning architecture."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Long, lanceolate leaves with glossy dark-green upper surface and clean serrated margins",
                "No shot-hole perforations, purple angular spots, or reddish leaf curl distortions",
                "Normal leaf turgor and healthy terminal extension growth",
            ],
            "stem_and_fruit_symptoms": ["Shoots smooth and brown without gummy cankers; fruit expanding with smooth, unblemished skin"],
            "progression": "Normal vegetative and fruit development.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain an open-center (vase) canopy through annual pruning to ensure sunlight reaches all fruiting wood.",
            "Practice regular orchard scouting for peach tree borers, oriental fruit moths, and brown rot.",
            "Apply balanced fertilizer in early spring; avoid late summer nitrogen applications.",
        ],
        "recommended_management": {
            "cultural_controls": ["Continue routine seasonal orchard management and ground cover maintenance."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult local extension if leaves display reddish thickened puckering in spring (peach leaf curl).",
        ],
        "sources": [
            {
                "title": "Peach Pest Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/peach/",
            },
        ],
    },

    # =========================================================================
    # BELL PEPPER (Capsicum annuum)
    # =========================================================================
    "Pepper,_bell___Bacterial_spot": {
        "raw_class": "Pepper,_bell___Bacterial_spot",
        "crop": "Pepper",
        "disease_name": "Bacterial Spot",
        "is_healthy": False,
        "category": "Bacterial",
        "causative_pathogen": {
            "scientific_name": "Xanthomonas euvesicatoria / Xanthomonas vesicatoria",
            "common_name": "Bacterial spot of pepper and tomato",
            "taxonomic_order_family": "Xanthomonadales: Xanthomonadaceae",
        },
        "overview": (
            "Bacterial spot is the most damaging bacterial disease of bell peppers in warm, humid production regions. "
            "It affects all aboveground parts of the plant, causing water-soaked spots, severe leaf defoliation that exposes "
            "fruit to sunscald, and raised scab-like lesions on peppers that destroy commercial grade."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 30°C (75°F to 86°F)",
            "humidity_moisture": "High relative humidity (>85%), frequent heavy rainfall, or overhead sprinkler irrigation.",
            "soil_conditions": "Not soil-dependent; driven by splashing surface moisture.",
            "key_triggers": [
                "Warm rainy spells with wind-driven water droplets",
                "Working in fields or harvesting while foliage is wet",
                "Use of uncertified, infected seed or greenhouse transplants",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, circular to irregular water-soaked spots (1-3 mm) on lower leaf surfaces",
                "Spots turn brown to black with a pale yellow-green halo on the upper surface",
                "Centers of spots become necrotic and papery; heavily infected leaves yellow and drop rapidly, causing severe defoliation",
            ],
            "stem_and_fruit_symptoms": [
                "Stems develop elongated dark cankers",
                "Fruit develops small, circular, blister-like raised green spots that turn brown, corky, and wart-like",
                "Defoliated canopies expose developing peppers to severe sunscald damage",
            ],
            "progression": "Bacteria enter stomata or wounds; under warm, wet conditions, spots develop in 5-7 days and multiply rapidly.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Splashing rain, wind-driven mist, and overhead irrigation water",
                "Contaminated seed, infected greenhouse transplants, and farm workers/equipment touching wet foliage",
            ],
            "survival_mechanism": "Survives on infected seed, in crop debris for several months, and on volunteer solanaceous weeds.",
        },
        "prevention_practices": [
            "Use certified, hot-water-treated seed and disease-free transplants from certified nurseries.",
            "Plant resistant pepper varieties bred with specific bacterial spot resistance genes (races 1 through 10).",
            "Rotate fields away from peppers, tomatoes, and other solanaceous crops for at least 2 to 3 years.",
            "Use drip irrigation under plastic mulch; never use overhead sprinkler systems.",
            "Strictly avoid entering or cultivating pepper fields while the foliage is wet with dew or rain.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and bury or destroy infected plant residues immediately following harvest.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative bactericides (e.g., fixed copper paired with mancozeb, or plant defense inducers like acibenzolar-S-methyl) early in the season before disease establishes.",
                "Bacteriophage treatments specific to Xanthomonas have shown efficacy in vegetable production systems when applied in evening hours.",
            ],
            "cautionary_dosage_note": (
                "Copper-resistant Xanthomonas strains are widespread. Consult university vegetable extension recommendations for local efficacy. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Few scattered water-soaked spots on lower leaves (<5% foliage); fruit clean. Immediate cultural sanitation and preventative spray required.",
            "severe": "Widespread leaf drop exposing developing fruit, and raised scab-like lesions on peppers. High economic loss risk.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Leaf drop exceeds 15% in the commercial pepper block.",
            "Lesions begin appearing on green bell peppers during fruit set.",
        ],
        "sources": [
            {
                "title": "Bacterial Spot of Pepper and Tomato",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/publication/VH056",
            },
            {
                "title": "Pepper Bacterial Spot",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/peppers/bacterial-spot/",
            },
        ],
    },

    "Pepper,_bell___healthy": {
        "raw_class": "Pepper,_bell___healthy",
        "crop": "Pepper",
        "disease_name": "Healthy Bell Pepper Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy bell pepper leaf tissue",
            "taxonomic_order_family": "None (Plantae: Solanaceae)",
        },
        "overview": (
            "The bell pepper foliage displays clean, glossy dark-green leaves with smooth margins, "
            "normal leaf turgor, and no signs of bacterial water-soaked spotting, viral mosaic mottle, or powdery mildew."
        ),
        "favorable_conditions": {
            "temperature_range": "21°C to 29°C (70°F to 84°F)",
            "humidity_moisture": "Moderate humidity with consistent soil moisture via drip irrigation; avoid drought stress during fruit set.",
            "soil_conditions": "Well-drained sandy loam or loam with pH 6.0 to 6.8 and rich organic matter.",
            "key_triggers": ["Drip irrigation, black/silver plastic mulch, balanced fertility, and scouted pest control."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Dark green, glossy, lanceolate to ovate leaves with smooth, intact margins",
                "No water-soaked spots, yellow halos, or viral mosaic distortion",
                "Healthy canopy providing complete shade over developing fruit clusters",
            ],
            "stem_and_fruit_symptoms": ["Stems firm without cankers; bell peppers developing firm, glossy, thick walls without sunscald or blossom-end rot"],
            "progression": "Normal vegetative canopy growth, flowering, and fruit sizing.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain drip irrigation to keep soil moisture uniform without wetting leaves.",
            "Apply balanced fertilizer with adequate calcium to prevent blossom-end rot.",
            "Monitor weekly for aphids, thrips, and mites that can transmit plant viruses.",
        ],
        "recommended_management": {
            "cultural_controls": ["Continue routine field scouting and maintain weed-free plastic mulched beds."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Seek advice if blossom-end rot (calcium deficiency) or thrips-vectored spotted wilt virus appears.",
        ],
        "sources": [
            {
                "title": "Peppers: Cultural Tips and Pest Management",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/peppers/",
            },
        ],
    },

    # =========================================================================
    # POTATO (Solanum tuberosum)
    # =========================================================================
    "Potato___Early_blight": {
        "raw_class": "Potato___Early_blight",
        "crop": "Potato",
        "disease_name": "Early Blight",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Alternaria solani",
            "common_name": "Early blight fungus of potato and tomato",
            "taxonomic_order_family": "Pleosporales: Pleosporaceae",
        },
        "overview": (
            "Early blight of potato is a widespread foliar disease that primarily targets older, maturing foliage "
            "and plants experiencing nutrient or environmental stress. It produces distinctive circular-to-irregular "
            "dark brown lesions with concentric rings ('target board' appearance) that can cause extensive defoliation "
            "and secondary tuber dry rot."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 29°C (75°F to 85°F)",
            "humidity_moisture": "Alternating wet and dry periods (wet nights with heavy dew followed by warm, dry sunny days).",
            "soil_conditions": "Nutrient-depleted soils (low nitrogen or potassium) heighten vine susceptibility.",
            "key_triggers": [
                "Vine aging past flowering/tuber bulking stage",
                "Crop stress from drought, insect feeding, or poor soil nutrition",
                "Abundant overhead pivot irrigation keeping foliage wet",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, dark brown to black spots appearing first on older, lower leaves",
                "Spots enlarge up to 1-1.5 cm and develop pronounced concentric rings creating a 'target board' or bullseye pattern",
                "Lesions are bounded by major leaf veins, often surrounded by a chlorotic yellow halo",
                "Severely infected leaves turn completely yellow, wither, and drop prematurely",
            ],
            "stem_and_fruit_symptoms": [
                "Brown, elongated lesions can form on stems and petioles",
                "Tubers develop sunken, dark, leathery circular lesions with raised purple borders; flesh beneath is corky and dry",
            ],
            "progression": "Starts on lower foliage and moves steadily upward as vines mature and mobilize nutrients into developing tubers.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown conidia and splashing rain/irrigation water from crop residues",
                "Overwintered inoculum in solanaceous crop debris and cull piles",
            ],
            "survival_mechanism": "Overwinters as fungal mycelium and conidia in infected potato and tomato crop debris, cull piles, and solanaceous weeds.",
        },
        "prevention_practices": [
            "Practice 2- to 3-year crop rotation with non-solanaceous crops (e.g., grains, legumes, corn).",
            "Maintain optimal vine fertility (especially nitrogen and potassium) to prevent premature vine senescence.",
            "Irrigate in the early morning to ensure foliar canopies dry before evening.",
            "Destroy all potato cull piles before spring planting; eliminate volunteer potato plants.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Avoid harvesting immature tubers with tender skins to prevent post-harvest tuber rot.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectant fungicides (e.g., chlorothalonil, mancozeb) starting after rows close or after flowering when early blight risk escalates.",
                "Rotate with systemic translaminar fungicides (FRAC 7, 9, 11) adhering to resistance management protocols.",
            ],
            "cautionary_dosage_note": (
                "Alternaria solani exhibits resistance to certain single-site fungicides (e.g., strobilurins). Follow state extension spray recommendations. Do not invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered target spots on lowest leaves (<10% foliage); canopy green and vigorous. Managed with standard protectants.",
            "severe": "Extensive blighting and defoliation progressing past mid-canopy during tuber bulking. Causes significant reduction in tuber yield and specific gravity.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Concentric lesions advance rapidly above mid-canopy prior to full tuber sizing.",
            "Symptoms are difficult to distinguish from Late Blight during wet weather.",
        ],
        "sources": [
            {
                "title": "Early Blight of Potato",
                "organization": "University of Idaho Extension",
                "url": "https://www.uidaho.edu/extension/ipm",
            },
            {
                "title": "Potato Disease Management: Early Blight",
                "organization": "North Dakota State University Extension",
                "url": "https://www.ag.ndsu.edu/publications/crops/",
            },
        ],
    },

    "Potato___Late_blight": {
        "raw_class": "Potato___Late_blight",
        "crop": "Potato",
        "disease_name": "Late Blight",
        "is_healthy": False,
        "category": "Oomycete",
        "causative_pathogen": {
            "scientific_name": "Phytophthora infestans",
            "common_name": "Potato late blight oomycete (water mold)",
            "taxonomic_order_family": "Peronosporales: Peronosporaceae",
        },
        "overview": (
            "Late blight, caused by the oomycete Phytophthora infestans, is historically the most devastating disease of potato "
            "(the cause of the 1840s Irish Potato Famine). It is an aggressive, fast-moving pathogen that can completely collapse "
            "a potato canopy within 7 to 10 days under cool, wet conditions and rot entire storage bins of tubers."
        ),
        "favorable_conditions": {
            "temperature_range": "12°C to 21°C (54°F to 70°F); hot weather above 30°C (86°F) suppresses development",
            "humidity_moisture": "Persistent high relative humidity (>90%) and continuous leaf wetness of 10+ hours (rain, fog, or heavy dew).",
            "soil_conditions": "Infected seed tubers planted in wet, cool soils.",
            "key_triggers": [
                "Cool, overcast, rainy weather systems lasting several consecutive days",
                "Infected seed tubers or unburied cull piles sprouting in spring",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Large, irregular, water-soaked pale-to-dark-green lesions expanding rapidly into brown-black necrotic blights",
                "Lesions are not restricted by leaf veins; often surrounded by a light yellow or pale green border",
                "A delicate white cottony or mildew-like growth (sporangiophores) appears on the lower leaf surface, especially at the margin between green and dead tissue in humid mornings",
            ],
            "stem_and_fruit_symptoms": [
                "Stems develop dark brown to black greasy water-soaked lesions that cause entire branches to snap",
                "Tubers develop irregular, sunken reddish-brown to purplish surface patches; flesh beneath exhibits a granular copper-brown dry rot extending into the tuber core",
            ],
            "progression": "Extremely rapid; under cool, humid conditions, a field can go from a few infected plants to total defoliation in 7-10 days.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne sporangia carried for miles on wind currents under overcast, humid skies",
                "Rain splash carrying sporangia down into the soil to infect tubers",
                "Infected seed tubers initiating primary focal infections in spring",
            ],
            "survival_mechanism": "Must overwinter in living potato tuber tissue: infected seed tubers, cull piles, and unharvested volunteer tubers in the soil.",
        },
        "prevention_practices": [
            "Plant only certified late-blight-free seed tubers from reputable seed certification programs.",
            "Destroy all cull piles by burying under 60 cm of soil, feeding to livestock, or freezing before spring.",
            "Eliminate all volunteer potato plants that emerge in rotated fields.",
            "Hilling: maintain adequate soil cover (at least 5-10 cm) over developing tubers to prevent washed-down sporangia from reaching them.",
            "Kill potato vines completely at least two weeks before harvest to ensure all foliar sporangia are dead before digging.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Monitor regional disease forecast models (e.g., BlightCast, USABlight) to time preventative sprays before rain events.",
                "Never harvest tubers from fields with active sporulating late blight foliage.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative protectants (chlorothalonil, mancozeb) when disease forecast thresholds are met.",
                "Targeted oomycete-specific systemic fungicides (e.g., mandipropamid, cyazofamid, fluopicolide) applied when late blight is confirmed in the region.",
            ],
            "cautionary_dosage_note": (
                "Phytophthora infestans develops resistance to specific fungicides (e.g., metalaxyl/mefenoxam). Consult university extension recommendations for local strain resistance. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Single localized focal leaf lesion detected. Immediate community notification and intensive systemic protectant coverage required.",
            "severe": "Widespread water-soaked black blighting across multiple canopy levels with visible white sporulation. Catastrophic risk to crop and region.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Any suspected late blight lesion with white cottony sporulation must be reported to university extension / agricultural authorities immediately.",
            "Water-soaked black stem lesions appear during cool, rainy weather.",
        ],
        "sources": [
            {
                "title": "Potato Late Blight Management",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
            {
                "title": "USABlight: National Late Blight Information System",
                "organization": "USDA / USABlight Consortium",
                "url": "https://usablight.org/",
            },
            {
                "title": "Late Blight of Potato",
                "organization": "Michigan State University Extension",
                "url": "https://www.canr.msu.edu/potato-late-blight/",
            },
        ],
    },

    "Potato___healthy": {
        "raw_class": "Potato___healthy",
        "crop": "Potato",
        "disease_name": "Healthy Potato Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy potato leaf tissue",
            "taxonomic_order_family": "None (Plantae: Solanaceae)",
        },
        "overview": (
            "The potato foliage displays clean, uniform green compound leaves, robust leaf turgor, "
            "and an absence of concentric target spots (early blight) or water-soaked necrotic blighting (late blight)."
        ),
        "favorable_conditions": {
            "temperature_range": "15°C to 22°C (59°F to 72°F) optimal for tuberization and vine development",
            "humidity_moisture": "Uniform soil moisture (65-80% available soil water capacity) through drip or scheduled overhead irrigation.",
            "soil_conditions": "Loose, well-drained, friable sandy loam with pH 5.5 to 6.5; well-aerated soil prevents tuber rot.",
            "key_triggers": ["Certified clean seed, balanced N-P-K nutrition, adequate hilling, and weather-based scouting."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Deep green compound foliage with smooth, intact leaflet margins",
                "No water-soaked spots, white sporulation on undersides, or concentric target rings",
                "Healthy canopy providing complete ground shading over the hills",
            ],
            "stem_and_fruit_symptoms": ["Stems erect and green without dark lesions; stolons setting healthy, smooth-skinned tubers beneath the hill"],
            "progression": "Normal vegetative vine growth, flowering, and tuber bulking.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain hill height to protect tubers from greening and spore wash.",
            "Irrigate during morning hours to ensure foliage dries quickly.",
            "Scout regularly using regional disease forecasting networks.",
        ],
        "recommended_management": {
            "cultural_controls": ["Continue routine crop scouting and monitor for Colorado potato beetle and potato leafhopper."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Seek guidance if regional late blight alerts are issued in neighboring counties.",
        ],
        "sources": [
            {
                "title": "Potato Production Guide",
                "organization": "University of Idaho Extension",
                "url": "https://www.uidaho.edu/extension",
            },
        ],
    },

    # =========================================================================
    # RASPBERRY (Rubus idaeus)
    # =========================================================================
    "Raspberry___healthy": {
        "raw_class": "Raspberry___healthy",
        "crop": "Raspberry",
        "disease_name": "Healthy Raspberry Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy raspberry leaf tissue",
            "taxonomic_order_family": "None (Plantae: Rosaceae)",
        },
        "overview": (
            "The raspberry foliage exhibits healthy, vibrant green coloration with intact compound leaflets, "
            "clean silvery-green undersides, and an absence of spur blight, cane botrytis, or rust lesions."
        ),
        "favorable_conditions": {
            "temperature_range": "18°C to 24°C (64°F to 75°F)",
            "humidity_moisture": "Moderate humidity with excellent cane ventilation and uniform root moisture without standing water.",
            "soil_conditions": "Deep, well-drained loamy soil with pH 6.0 to 6.8 and high organic matter content.",
            "key_triggers": ["Trellising, proper cane thinning, drip irrigation, and regular winter sanitation."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Compound leaves with 3 to 5 serrated, healthy green leaflets",
                "No yellow rust pustules, circular spots, or marginal scorch",
                "Silvery, pubescent leaf undersides free of powdery mildew",
            ],
            "stem_and_fruit_symptoms": ["Canes clean without purplish-brown spur blight lesions or powdery cane botrytis; healthy drupelet formation"],
            "progression": "Normal primocane and floricane development.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Thin primocanes to maintain row width under 45 cm (18 inches) for optimal air penetration.",
            "Prune and remove spent floricanes immediately after summer harvest to eliminate disease carryover.",
            "Use drip irrigation to deliver moisture directly to roots without wetting canes or foliage.",
        ],
        "recommended_management": {
            "cultural_controls": ["Prune dead canes and maintain weed-free row strips."],
            "biological_and_protectant_measures": ["No chemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": ["Consult extension if cane dieback or orange rust pustules appear."],
        "sources": [
            {
                "title": "Raspberry Pest Management Guidelines",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/caneberries/",
            },
        ],
    },

    # =========================================================================
    # SOYBEAN (Glycine max)
    # =========================================================================
    "Soybean___healthy": {
        "raw_class": "Soybean___healthy",
        "crop": "Soybean",
        "disease_name": "Healthy Soybean Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy soybean leaf tissue",
            "taxonomic_order_family": "None (Plantae: Fabaceae)",
        },
        "overview": (
            "The soybean trifoliate leaves display healthy, uniform green coloration, intact leaf lamina, "
            "and an absence of frogeye leaf spots, Septoria brown spots, sudden death syndrome chlorosis, or bacterial blight."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 30°C (68°F to 86°F)",
            "humidity_moisture": "Adequate seasonal moisture, particularly during the critical flowering (R1-R2) and pod-fill (R3-R5) stages.",
            "soil_conditions": "Well-drained loam or silt loam with pH 6.0 to 6.8; effective Bradyrhizobium nodulation.",
            "key_triggers": ["Certified clean seed, balanced fertility, proper row spacing, and crop rotation."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Clean trifoliate leaves with vibrant green coloration and smooth edges",
                "No circular frogeye lesions, angular water-soaked spots, or interveinal yellow blotches",
                "Healthy turgor and normal vegetative canopy growth",
            ],
            "stem_and_fruit_symptoms": ["Stems erect and green without brown stem rot discoloration; pods developing uniformly at leaf axils"],
            "progression": "Normal vegetative (V) and reproductive (R) growth stages.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Rotate crops annually with corn, wheat, or other non-host crops to interrupt soilborne pathogen cycles.",
            "Plant certified high-germination seed treated with appropriate rhizobial inoculant.",
            "Scout fields regularly starting at early flowering through pod development.",
        ],
        "recommended_management": {
            "cultural_controls": ["Standard field management, weed suppression, and seasonal scouting."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult local extension if interveinal chlorosis (sudden death syndrome) appears in pod-fill stages.",
        ],
        "sources": [
            {
                "title": "Soybean Disease Management",
                "organization": "Crop Protection Network (CPN)",
                "url": "https://cropprotectionnetwork.org/",
            },
        ],
    },

    # =========================================================================
    # SQUASH (Cucurbita pepo / Cucurbita moschata)
    # =========================================================================
    "Squash___Powdery_mildew": {
        "raw_class": "Squash___Powdery_mildew",
        "crop": "Squash",
        "disease_name": "Powdery Mildew",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Podosphaera xanthii (syn. Sphaerotheca fuliginea) and Erysiphe cichoracearum",
            "common_name": "Cucurbit powdery mildew fungi",
            "taxonomic_order_family": "Erysiphales: Erysiphaceae",
        },
        "overview": (
            "Powdery mildew is the most common and damaging foliar disease of squash, pumpkins, and other cucurbits. "
            "It produces talcum-powder-like fungal patches on both leaf surfaces and petioles. "
            "Unchecked infections cause leaves to yellow, turn brown, and die prematurely, resulting in sunscald on fruit, "
            "incomplete ripening, reduced sugar content, and diminished storage life."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 27°C (68°F to 81°F)",
            "humidity_moisture": "High relative humidity (50-90%) at night favors germination; free standing water on leaves actually inhibits it. Dense shading promotes fungal spread.",
            "soil_conditions": "Not soil-driven; favored by dense plant canopies and low light.",
            "key_triggers": [
                "Mid-to-late summer periods with warm days, high humidity, and dense overlapping leaves",
                "Planting susceptible varieties in shaded or sheltered field locations",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "White, powdery circular spots appearing first on shaded lower leaves, petioles, and leaf undersides",
                "Spots expand rapidly to cover entire upper and lower leaf surfaces with a white talcum-like coating",
                "Infected leaves turn yellow, then brown, become dry and brittle ('papery'), and die prematurely",
            ],
            "stem_and_fruit_symptoms": [
                "Petioles develop dense white powdery mycelium",
                "Fruit is rarely infected directly, but defoliation leads to severe fruit sunscald, poor handle/pedicel condition, and unmarketable squash",
            ],
            "progression": "Infection starts on the lower, older shaded leaves and moves rapidly up to younger leaves as the vine canopy closes.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne conidia carried long distances by wind currents",
            ],
            "survival_mechanism": "Survives between seasons on greenhouse cucurbits, weed hosts, and southern crops, with spores blowing northward.",
        },
        "prevention_practices": [
            "Plant cucurbit varieties with genetic resistance or tolerance to powdery mildew races 1 and 2.",
            "Ensure wide plant and row spacing to maximize sunlight penetration and airflow throughout the canopy.",
            "Scout lower leaf surfaces and inner canopy leaves weekly starting at fruit set.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and dispose of early localized infected leaves if noticed before general canopy colonization.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectants (e.g., potassium bicarbonate, horticultural mineral oils, or bio-fungicides like Bacillus subtilis) at first detection on lower leaves.",
                "Rotate systemic fungicides with different FRAC codes (e.g., FRAC 3, 11, U06, 50) as recommended by university vegetable extension to delay resistance development.",
            ],
            "cautionary_dosage_note": (
                "Podosphaera xanthii develops fungicide resistance rapidly. Rotate chemical classes strictly according to current extension guidelines. Do not invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Few white powdery spots on lower shaded leaves only (<10% leaf area); fruit shaded. Readily suppressed with timely protectants.",
            "severe": "Widespread white coating over entire canopy with upper leaves browning and drying out. High risk of fruit sunscald and early vine collapse.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Powdery spots appear across upper canopy leaves prior to fruit maturity.",
            "Standard protectant sprays fail to halt spread, indicating possible fungicide resistance.",
        ],
        "sources": [
            {
                "title": "Cucurbit Powdery Mildew",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
            {
                "title": "Powdery Mildew on Cucurbits",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/cucurbits/powdery-mildew/",
            },
        ],
    },

    # =========================================================================
    # STRAWBERRY (Fragaria x ananassa)
    # =========================================================================
    "Strawberry___Leaf_scorch": {
        "raw_class": "Strawberry___Leaf_scorch",
        "crop": "Strawberry",
        "disease_name": "Leaf Scorch",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Diplocarpon earlianum",
            "common_name": "Strawberry leaf scorch fungus (anamorph: Marssonia fragariae)",
            "taxonomic_order_family": "Helotiales: Dermateaceae",
        },
        "overview": (
            "Strawberry leaf scorch is a common foliar disease affecting commercial and garden strawberries. "
            "It produces numerous small, irregular dark-purple spots that coalesce until entire leaves look burned or 'scorched'. "
            "Severe infections weaken plants, reduce crown vitality, and compromise berry sizing and runner production."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 25°C (68°F to 77°F)",
            "humidity_moisture": "Frequent rains or overhead sprinkler irrigation providing continuous leaf wetness for 6 to 12+ hours.",
            "soil_conditions": "Poorly drained planting beds and dense matted-row plantings.",
            "key_triggers": [
                "Prolonged leaf wetness from frequent rain or overhead sprinkler watering",
                "Overcrowded strawberry beds with dense, unweeded canopies",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, irregular purple-to-brown spots (1-5 mm) appearing on the upper surface of leaves",
                "Unlike common leaf spot (Mycosphaerella), scorch lesions lack white or gray centers; they remain dark purple throughout",
                "Spots coalesce rapidly, turning the leaf tissue between spots purple, then brown and dry, giving the leaf a burned or scorched appearance",
                "Leaf margins curl upward as tissue dies",
            ],
            "stem_and_fruit_symptoms": [
                "Petioles, stolons, and flower stalks develop elongated sunken purple spots that can girdle stems and kill flowers/fruit",
                "Fruit calyx (sepals) becomes infected and turns brown, severely detracting from fruit appearance",
            ],
            "progression": "Conidia splash from old infected leaves onto new spring foliage; lesions expand and re-sporulate continuously during wet weather.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Conidia distributed primarily by splashing water droplets from rain or overhead irrigation",
                "Transport on infected nursery runner plants",
            ],
            "survival_mechanism": "Overwinters as dormant mycelium and ascospores in living, infected strawberry leaves and dead crop debris.",
        },
        "prevention_practices": [
            "Plant resistant strawberry cultivars (e.g., Allstar, Chandler, Earliglow, Tribute). Susceptible varieties include Honeoye and Raritan.",
            "Establish strawberry plantings in full sun and well-drained, raised beds.",
            "Use drip irrigation under plastic mulch instead of overhead sprinklers to eliminate foliar splash.",
            "Renovate matted-row plantings promptly after harvest: mow old foliage and narrow row widths to improve airflow.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Rake, remove, and destroy old infected leaves during post-harvest bed renovation.",
            ],
            "biological_and_protectant_measures": [
                "Apply registered preventative fungicides (e.g., captan or copper protectants) early in the spring as new foliage emerges if the field has a history of scorch.",
            ],
            "cautionary_dosage_note": (
                "Follow product label directions, pre-harvest intervals, and resistance management strategies. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Few scattered purple spots on older leaves (<10% leaf area); calyxes clean. Managed through drip irrigation and post-harvest leaf cleanup.",
            "severe": "Widespread scorched, brown leaves with girdled fruit stems and brown calyxes. Substantial reduction in fruit size and harvest volume.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Foliar scorching spreads to more than 25% of canopy during bloom and green fruit stage.",
            "Fruit stems or calyxes show widespread girdling and browning.",
        ],
        "sources": [
            {
                "title": "Strawberry Leaf Scorch",
                "organization": "North Carolina State University Extension",
                "url": "https://content.ces.ncsu.edu/leaf-scorch-of-strawberry",
            },
            {
                "title": "Strawberry Disease Management: Foliar Diseases",
                "organization": "Ohio State University Extension",
                "url": "https://ohioline.osu.edu/",
            },
        ],
    },

    "Strawberry___healthy": {
        "raw_class": "Strawberry___healthy",
        "crop": "Strawberry",
        "disease_name": "Healthy Strawberry Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy strawberry leaf tissue",
            "taxonomic_order_family": "None (Plantae: Rosaceae)",
        },
        "overview": (
            "The strawberry foliage displays vigorous, dark-green trifoliate leaves with clean, saw-toothed margins, "
            "normal leaf turgor, and no purple scorch lesions, common leaf spot rings, or powdery mildew coatings."
        ),
        "favorable_conditions": {
            "temperature_range": "15°C to 24°C (59°F to 75°F)",
            "humidity_moisture": "Moderate humidity with consistent root moisture via drip irrigation; raised planting beds.",
            "soil_conditions": "Fertile, well-drained sandy loam with pH 5.8 to 6.5 and rich organic matter.",
            "key_triggers": ["Raised plasticulture beds, drip irrigation, certified clean planting stock, and good bed drainage."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Clean trifoliate leaves with glossy dark-green upper surface and pronounced serration",
                "No purple specks, gray-centered spots, or leaf margin curling",
                "Healthy new leaf emergence from the central crown",
            ],
            "stem_and_fruit_symptoms": ["Petioles and stolons firm without cankers; flowers and developing berries clean with bright green calyxes"],
            "progression": "Normal vegetative crown development, flowering, and berry maturation.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Maintain drip irrigation under plastic mulch to prevent wet foliage and fruit rot.",
            "Straw-mulch bare-ground rows to prevent soil splashing onto berries.",
            "Scout regularly for spider mites and gray mold (Botrytis) during bloom.",
        ],
        "recommended_management": {
            "cultural_controls": ["Standard commercial strawberry stewardship and timely weed removal."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Consult extension if sudden crown collapse (Phytophthora / anthracnose) occurs during warm weather.",
        ],
        "sources": [
            {
                "title": "Strawberry Integrated Pest Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/strawberry/",
            },
        ],
    },

    # =========================================================================
    # TOMATO (Solanum lycopersicum)
    # =========================================================================
    "Tomato___Bacterial_spot": {
        "raw_class": "Tomato___Bacterial_spot",
        "crop": "Tomato",
        "disease_name": "Bacterial Spot",
        "is_healthy": False,
        "category": "Bacterial",
        "causative_pathogen": {
            "scientific_name": "Xanthomonas vesicatoria, X. euvesicatoria, X. perforans, and X. gardneri",
            "common_name": "Bacterial spot species complex of tomato",
            "taxonomic_order_family": "Xanthomonadales: Xanthomonadaceae",
        },
        "overview": (
            "Bacterial spot is an economically devastating disease of field and greenhouse tomatoes worldwide. "
            "It affects all aboveground plant parts, producing small water-soaked lesions that cause severe leaf defoliation, "
            "blossom abortion, and dark scab-like fruit blemishes that render fresh-market tomatoes unmarketable."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 30°C (75°F to 86°F)",
            "humidity_moisture": "High relative humidity (>85%), wind-driven rains, or overhead irrigation keeping leaves wet for extended periods.",
            "soil_conditions": "Not soil-driven; spread by splashing water and touching wet plants.",
            "key_triggers": [
                "Warm, rainy spells and overhead irrigation",
                "Field operations performed when plants are wet",
                "Use of uncertified seed or contaminated greenhouse transplants",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, circular to angular water-soaked spots (1-3 mm wide) on leaves",
                "Spots darken to brown or black, often surrounded by a prominent yellow halo",
                "Centers of spots become dry and papery, sometimes tearing out to give a ragged appearance",
                "Heavily infected leaves turn yellow, scorch, and drop prematurely, leaving fruit exposed to sunscald",
            ],
            "stem_and_fruit_symptoms": [
                "Elongated dark lesions on stems and petioles; blossom drop",
                "Fruit develops small, slightly raised black spots that enlarge up to 3-6 mm, becoming brown, rough, and scab-like",
            ],
            "progression": "Bacteria enter through stomata and wounds; under warm, wet conditions, spots appear within 5-7 days and spread exponentially.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Wind-driven rain, splashing water droplets, and overhead irrigation",
                "Infested seed, infected transplants, and mechanical contact by workers/machinery in wet fields",
            ],
            "survival_mechanism": "Overwinters in infected crop residue, on volunteer tomato plants, and on contaminated seed surfaces.",
        },
        "prevention_practices": [
            "Use certified pathogen-free, hot-water-treated seed and inspected disease-free transplants.",
            "Practice 2- to 3-year crop rotation away from solanaceous crops (tomatoes, peppers, potatoes).",
            "Utilize drip irrigation rather than overhead sprinklers; avoid working in fields when foliage is wet.",
            "Sanitize trellising stakes, tools, and harvest crates with a 10% bleach or sanitizing quaternary solution.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and bury crop residue immediately after final harvest.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative bactericides (copper hydroxide mixed with mancozeb, or plant defense activators like acibenzolar-S-methyl) early before disease becomes widespread.",
                "Targeted bacteriophage formulations applied in late afternoon or evening have demonstrated efficacy in reducing field spread.",
            ],
            "cautionary_dosage_note": (
                "Copper-resistant strains of Xanthomonas are prevalent in many regions. Consult university extension vegetable recommendations for efficacy. Do not invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Few scattered dark spots on lower leaves (<5% canopy); fruit clean. Immediate sanitization and preventative bactericide coverage required.",
            "severe": "Widespread leaf drop, exposed fruit suffering sunscald, and scab-like lesions on green fruit. High commercial loss.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Active scab-like spots appear on green fruit during early sizing.",
            "Defoliation exceeds 20% in commercial tomato production blocks.",
        ],
        "sources": [
            {
                "title": "Bacterial Spot of Tomato and Pepper",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/publication/VH056",
            },
            {
                "title": "Tomato Bacterial Spot",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
        ],
    },

    "Tomato___Early_blight": {
        "raw_class": "Tomato___Early_blight",
        "crop": "Tomato",
        "disease_name": "Early Blight",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Alternaria solani",
            "common_name": "Early blight fungus of tomato and potato",
            "taxonomic_order_family": "Pleosporales: Pleosporaceae",
        },
        "overview": (
            "Early blight is one of the most common and persistent fungal diseases of tomato. "
            "It affects foliage, stems, and fruit, producing distinctive dark brown spots with concentric rings ('bullseye' or 'target board' pattern). "
            "Starting on the oldest lower foliage, it progresses upward, causing heavy defoliation and exposing fruit to sunscald."
        ),
        "favorable_conditions": {
            "temperature_range": "24°C to 29°C (75°F to 85°F)",
            "humidity_moisture": "Alternating periods of wet and dry weather; heavy morning dews, frequent rain, or overhead watering.",
            "soil_conditions": "Plants stressed by poor nutrition, heavy fruit load, or drought are especially susceptible.",
            "key_triggers": [
                "Warm, humid weather with frequent rain showers or morning fog",
                "Unmulched soil allowing rain to splash soilborne spores onto lower leaves",
                "Dense, unpruned indeterminate vines with limited air circulation",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Small, dark brown to black spots appearing first on older, lower leaves near the ground",
                "Spots enlarge up to 1-1.5 cm and develop pronounced concentric rings creating a characteristic 'target board' or bullseye appearance",
                "A distinct chlorotic yellow halo surrounds expanding lesions",
                "Infected leaves turn yellow, wither, dry up, and drop from the base of the plant upward",
            ],
            "stem_and_fruit_symptoms": [
                "Stems develop dark, sunken collar-rot cankers at the soil line on seedlings or mature branches",
                "Fruit develops dark, leathery sunken lesions with concentric rings, typically near the calyx stem attachment",
            ],
            "progression": "Infection initiates on lowest leaves touching or near the soil; wind and rain splash carry spores upward through the canopy as the season progresses.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Rain splash and windblown conidia originating from overwintered solanaceous crop debris and soil",
                "Contaminated seed, infected transplants, and volunteer weeds (e.g., black nightshade)",
            ],
            "survival_mechanism": "Overwinters as fungal mycelium and conidia in infected crop residue, in soil, and on perennial weeds.",
        },
        "prevention_practices": [
            "Apply organic mulch (straw) or plastic mulch around the base of plants to prevent soil from splashing onto lower leaves.",
            "Prune off the lowest 30 cm (12 inches) of foliage once plants are established to eliminate contact with soil splash.",
            "Ensure proper plant spacing and stake or trellis vines to maximize airflow and sunlight penetration.",
            "Water at the base of plants using drip irrigation or soaker hoses; avoid overhead watering.",
            "Practice a 2- to 3-year crop rotation with non-solanaceous crops.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Prune and remove infected lower leaves as soon as target spots are detected; sanitize shears between plants.",
                "Rake and destroy all plant debris at the end of the season; do not compost blighted vines.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectant fungicides (chlorothalonil, copper formulations, or mancozeb) preventatively starting at fruit set or when weather favors disease.",
                "Bio-fungicides containing Bacillus subtilis or Bacillus amyloliquefaciens can suppress early disease development in home garden or organic settings.",
            ],
            "cautionary_dosage_note": (
                "Adhere strictly to label application rates, pre-harvest intervals, and FRAC group rotation. Never invent chemical dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Concentric target spots confined to lowest leaves below first flower cluster (<10% foliage). Readily controlled by pruning lower leaves and applying mulch.",
            "severe": "Target spots and yellowing advance past mid-canopy with heavy defoliation and stem collar rot. Significant risk of sunscald and yield loss.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Concentric target lesions advance above the primary fruit cluster prior to first harvest.",
            "Dark sunken leathery rot appears on the shoulders of green developing tomatoes.",
        ],
        "sources": [
            {
                "title": "Early Blight of Tomato",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
            {
                "title": "Tomato Early Blight",
                "organization": "Clemson University Cooperative Extension",
                "url": "https://hgic.clemson.edu/factsheet/tomato-diseases-disorders/",
            },
            {
                "title": "Early Blight of Tomato and Potato",
                "organization": "University of Minnesota Extension",
                "url": "https://extension.umn.edu/plant-diseases/early-blight-tomato",
            },
        ],
    },

    "Tomato___Late_blight": {
        "raw_class": "Tomato___Late_blight",
        "crop": "Tomato",
        "disease_name": "Late Blight",
        "is_healthy": False,
        "category": "Oomycete",
        "causative_pathogen": {
            "scientific_name": "Phytophthora infestans",
            "common_name": "Late blight oomycete (water mold)",
            "taxonomic_order_family": "Peronosporales: Peronosporaceae",
        },
        "overview": (
            "Late blight of tomato is a devastating, community-wide plant disease caused by the oomycete Phytophthora infestans. "
            "Under cool, wet conditions, it can destroy entire tomato plantings within a week. "
            "It produces rapidly expanding water-soaked greasy lesions, white fungal-like sporulation on leaf undersides, "
            "and firm, greasy brown rot on green and ripe fruit."
        ),
        "favorable_conditions": {
            "temperature_range": "15°C to 22°C (59°F to 72°F); inhibited by prolonged hot, dry weather above 30°C (86°F)",
            "humidity_moisture": "High relative humidity (>90%) with prolonged leaf wetness (heavy dew, persistent fog, or continuous rain).",
            "soil_conditions": "Not soil-driven; windblown sporangia travel miles on overcast days.",
            "key_triggers": [
                "Cool, rainy, overcast weather systems lasting several consecutive days",
                "Nearby infected potato cull piles or infected tomato transplants",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Large, irregular water-soaked pale-to-purplish-black lesions on leaves",
                "Lesions are not vein-bounded; expand rapidly across entire leaflets without chlorotic halos",
                "In moist morning conditions, delicate white, cottony fungal-like growth (sporangiophores) appears on the underside of leaves at lesion margins",
                "Blighted foliage quickly wilts, shrivels, turns brown, and dies",
            ],
            "stem_and_fruit_symptoms": [
                "Stems develop dark brown to black greasy-looking lesions that weaken branches and cause lodging",
                "Fruit develops large, firm, greasy-looking olive-to-brown lesions with an uneven, bumpy surface",
            ],
            "progression": "Exceptionally rapid; plants can collapse from healthy to brown, rotting vegetation within 5 to 7 days.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Windblown sporangia carried for miles through the air during overcast, humid weather",
                "Infected greenhouse transplants and volunteer potato/tomato plants",
            ],
            "survival_mechanism": "Must survive in living host tissue over winter: infected potato tubers, greenhouse plants, and year-round solanaceous crops in frost-free regions.",
        },
        "prevention_practices": [
            "Plant resistant tomato cultivars with Ph-2 and Ph-3 genes (e.g., Mountain Magic, Defiant, Iron Lady, Plum Regal).",
            "Buy certified disease-free transplants; inspect incoming nursery stock carefully for water-soaked stem lesions.",
            "Destroy all nearby volunteer potato and tomato plants and cull piles.",
            "Space plants generously to promote rapid air drying, and use drip irrigation exclusively.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Track national/regional late blight monitoring platforms (e.g., USABlight) to stay informed of local outbreaks.",
                "Immediately remove and bag severely infected plants during sunny, dry hours to prevent spore plumes.",
            ],
            "biological_and_protectant_measures": [
                "Apply preventative protectant fungicides (chlorothalonil, copper) before rain events when late blight is active in the region.",
                "Targeted oomycete-specific translaminar fungicides applied promptly upon disease alert in commercial production.",
            ],
            "cautionary_dosage_note": (
                "Phytophthora infestans is an oomycete, not a true fungus; standard general fungicides are often ineffective. Follow extension recommendations strictly. Do not invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Single water-soaked lesion identified with early white sporulation. Requires immediate protective action across the entire planting.",
            "severe": "Widespread black water-soaked blighting of stems, foliage collapse, and greasy fruit rot. Complete crop loss imminent.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Any water-soaked lesion displaying white cottony sporulation on leaf undersides should be reported immediately to university extension.",
            "Greasy brown sunken lesions appear on green tomato fruit.",
        ],
        "sources": [
            {
                "title": "Tomato Late Blight",
                "organization": "Cornell University CALS Late Blight Decision Support System",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
            {
                "title": "USABlight Late Blight Network",
                "organization": "USDA / Extension Consortium",
                "url": "https://usablight.org/",
            },
        ],
    },

    "Tomato___Leaf_Mold": {
        "raw_class": "Tomato___Leaf_Mold",
        "crop": "Tomato",
        "disease_name": "Leaf Mold",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Passalora fulva (syn. Cladosporium fulvum, Fulvia fulva)",
            "common_name": "Tomato leaf mold fungus",
            "taxonomic_order_family": "Mycosphaerellales: Mycosphaerellaceae",
        },
        "overview": (
            "Tomato leaf mold is a common and damaging fungal disease primarily affecting tomatoes grown in high tunnels, "
            "greenhouses, and sheltered fields with restricted air circulation. It produces pale yellow spots on upper leaf surfaces "
            "with dense, velvety olive-green to brown fungal mats on the corresponding underside, leading to extensive defoliation."
        ),
        "favorable_conditions": {
            "temperature_range": "21°C to 24°C (70°F to 75°F)",
            "humidity_moisture": "Persistent high relative humidity (>85%); does not require free standing water on leaves to germinate.",
            "soil_conditions": "Not soil-driven; microclimate humidity inside protected structures is the primary driver.",
            "key_triggers": [
                "High relative humidity inside high tunnels and greenhouses with inadequate venting",
                "Dense, unpruned indeterminate tomato foliage with poor internal air circulation",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Pale green to light yellow chlorotic spots with indefinite margins on the upper leaf surface",
                "Dense, velvety olive-green to dark brown fungal sporulation on the underside of the leaf directly beneath the yellow spots",
                "As the disease progresses, yellow spots turn necrotic brown and leaves curl, wither, and drop prematurely",
                "Infection begins on older, lower foliage and progresses steadily upward toward the growing tip",
            ],
            "stem_and_fruit_symptoms": [
                "Stems and blossoms are occasionally infected; blossom drop can occur",
                "Fruit is rarely infected directly, but defoliation reduces fruit yield and sizing",
            ],
            "progression": "Spores land on leaf undersides, penetrate through open stomata, and sporulate profusely under high humidity.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Air currents, greenhouse ventilation fans, and splashing water droplets",
                "Transported on clothing, hands, pruning shears, and trellising twine",
            ],
            "survival_mechanism": "Overwinters as conidia and sclerotia-like structures in crop residue, on greenhouse structures, stakes, and in seeds.",
        },
        "prevention_practices": [
            "Ventilate high tunnels and greenhouses aggressively: use ridge vents, roll-up sides, and horizontal airflow (HAF) fans to keep relative humidity below 85%.",
            "Prune lower leaves (suckering) to create an open under-canopy and maintain wide row spacing.",
            "Water exclusively with drip irrigation; avoid any overhead watering that increases structure humidity.",
            "Select resistant tomato cultivars with Cf resistance genes where available for protected culture.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and bag infected lower leaves at first detection during warm, dry midday hours.",
                "Sanitize greenhouse walls, benches, and trellising materials between crop cycles.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectant fungicides (copper formulations, bio-fungicides like Bacillus amyloliquefaciens) at first sign of lower-leaf yellowing.",
                "Rotate with registered fungicides labeled for greenhouse/high-tunnel tomato production as recommended by extension guides.",
            ],
            "cautionary_dosage_note": (
                "Many fungicides labeled for field use are strictly prohibited inside enclosed greenhouse or high-tunnel structures. Check labels carefully. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Few pale yellow spots on lowest leaves with light olive sporulation on undersides (<10% foliage). Controlled with venting and suckering.",
            "severe": "Widespread velvety olive mats on more than 30% of leaves, causing heavy leaf browning and defoliation throughout the canopy.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Velvety olive fungal mats spread to middle and upper canopy leaves in high-tunnel production.",
            "Blossom abortion and severe defoliation threaten fruit set.",
        ],
        "sources": [
            {
                "title": "Tomato Leaf Mold",
                "organization": "University of Massachusetts Extension Greenhouse Crops and Floriculture",
                "url": "https://ag.umass.edu/greenhouse-floriculture/fact-sheets/tomato-leaf-mold",
            },
            {
                "title": "Leaf Mold of Tomato",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
        ],
    },

    "Tomato___Septoria_leaf_spot": {
        "raw_class": "Tomato___Septoria_leaf_spot",
        "crop": "Tomato",
        "disease_name": "Septoria Leaf Spot",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Septoria lycopersici",
            "common_name": "Septoria leaf spot fungus of tomato",
            "taxonomic_order_family": "Mycosphaerellales: Mycosphaerellaceae",
        },
        "overview": (
            "Septoria leaf spot is one of the most destructive and widespread foliar diseases of tomato in warm, wet temperate regions. "
            "It produces numerous small, circular spots with dark margins and light gray centers containing tiny black pycnidia. "
            "Although it rarely attacks the fruit directly, it causes severe bottom-up defoliation that weakens vines and causes heavy sunscald."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 25°C (68°F to 77°F)",
            "humidity_moisture": "Extended periods of high relative humidity (>80%) and persistent leaf wetness from rain or overhead watering.",
            "soil_conditions": "Unmulched soil where rain splashes overwintered spores onto lower leaves.",
            "key_triggers": [
                "Warm rainy spells following tomato row closure",
                "Overhead sprinkler irrigation or splashing rainfall",
                "Tomato planted in consecutive years in the same plot",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Numerous small, circular spots (1.5 to 3 mm in diameter) appearing first on the oldest lower leaves",
                "Spots have dark brown to black outer margins with distinctive light tan to ash-gray centers",
                "Tiny, black pimple-like fruiting bodies (pycnidia) are visible inside the gray centers with a 10x hand lens",
                "Severely infected leaves turn yellow, wither, dry out, and drop off; vines take on an open, bare-legged appearance",
            ],
            "stem_and_fruit_symptoms": [
                "Small, elongated spots can appear on stems, petioles, and calyxes",
                "Fruit is not infected directly, but extensive defoliation exposes fruit to severe sunscald and reduces yield",
            ],
            "progression": "Pycnidia release gelatinous spore masses in rain; water drops splash spores to higher leaves, driving rapid bottom-up defoliation.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Rain splash and overhead irrigation water distributing conidia from lower to upper canopy",
                "Mechanical transmission by workers, equipment, and insects moving through wet foliage",
            ],
            "survival_mechanism": "Overwinters as pycnidia in solanaceous crop residue, on wooden tomato stakes, and on volunteer nightshades.",
        },
        "prevention_practices": [
            "Apply a thick layer of organic mulch (straw) or plastic mulch around plants to prevent rain from splashing spores from soil onto leaves.",
            "Prune off lower leaves up to 30 cm (12 inches) above the ground once plants are established.",
            "Stake, cage, or trellis tomato vines to keep foliage off the ground and maximize airflow.",
            "Water only with drip irrigation at ground level; never use overhead sprinklers.",
            "Practice 2- to 3-year crop rotation away from tomatoes, potatoes, and other solanaceous crops.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Remove and destroy infected lower leaves as soon as circular spots are detected.",
                "Thoroughly clean and disinfect wooden stakes with a 10% bleach solution before reuse.",
            ],
            "biological_and_protectant_measures": [
                "Apply protectant fungicides (chlorothalonil, copper hydroxide, or mancozeb) starting at first symptom detection on lower leaves and repeat during rainy periods as permitted by labels.",
            ],
            "cautionary_dosage_note": (
                "Adhere to label application rates, maximum seasonal limits, and pre-harvest intervals. Never invent chemical dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered circular spots on lowest leaves (<10% foliage); upper canopy green. Controlled by removing lower leaves and applying mulch.",
            "severe": "Dense spotting and defoliation progressing past mid-canopy; vines largely bare with exposed, sunscalded fruit.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Pycnidia-filled spots advance rapidly past mid-canopy prior to primary fruit harvest.",
            "Defoliation exceeds 25% of commercial tomato foliage.",
        ],
        "sources": [
            {
                "title": "Septoria Leaf Spot of Tomato",
                "organization": "Missouri Botanical Garden Gardening Help",
                "url": "https://www.missouribotanicalgarden.org/",
            },
            {
                "title": "Tomato Septoria Leaf Spot",
                "organization": "Penn State Extension",
                "url": "https://extension.psu.edu/tomato-disease-septoria-leaf-spot",
            },
            {
                "title": "Septoria Leaf Spot of Tomato",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
        ],
    },

    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "raw_class": "Tomato___Spider_mites Two-spotted_spider_mite",
        "crop": "Tomato",
        "disease_name": "Two-Spotted Spider Mites",
        "is_healthy": False,
        "category": "Pest/Arachnid",
        "causative_pathogen": {
            "scientific_name": "Tetranychus urticae",
            "common_name": "Two-spotted spider mite (pest arachnid)",
            "taxonomic_order_family": "Trombidiformes: Tetranychidae",
        },
        "overview": (
            "The two-spotted spider mite is a major non-fungal arachnid pest of tomatoes, particularly in greenhouses, "
            "high tunnels, and hot, dry field seasons. Mites feed by piercing plant cells on leaf undersides and sucking out chlorophyll, "
            "producing characteristic yellow stippling, bronzing, fine silken webbing, and complete canopy desiccation."
        ),
        "favorable_conditions": {
            "temperature_range": "27°C to 35°C (80°F to 95°F); reproduction accelerates dramatically in hot weather (egg to adult in 5 to 7 days at 30°C)",
            "humidity_moisture": "Low relative humidity (<50%) and dry, dusty conditions; overhead rain or moisture suppresses mite colonies.",
            "soil_conditions": "Drought-stressed plants are especially vulnerable to mite population explosions.",
            "key_triggers": [
                "Hot, dry, dusty summer conditions",
                "Broad-spectrum insecticide use (e.g., pyrethroids) that kills natural predatory mites and insects",
                "Over-fertilization with nitrogen producing succulent foliage",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Fine, pinpoint yellow-to-white specks or dots ('stippling') on the upper leaf surface",
                "Leaf undersides reveal microscopic yellow-green to amber mites with two dark body spots, along with clear spherical eggs",
                "As populations surge, leaves turn bronze, yellow, or grayish-brown, dry up, and drop",
                "Fine silken webbing appears on leaf undersides, petioles, and terminal growing points",
            ],
            "stem_and_fruit_symptoms": [
                "Webbing blankets growing tips and flower clusters, causing blossom drop",
                "Fruit on heavily infested plants is small, pale, and exposed to sunscald",
            ],
            "progression": "Mites multiply on lower leaf undersides; as colonies grow, they spread upward and produce dense webs to migrate via wind ballooning.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Active crawling between overlapping leaves",
                "Wind dispersal on silken threads ('ballooning') across fields",
                "Transported on greenhouse tools, clothing, and infested seedlings",
            ],
            "survival_mechanism": "Overwinters as diapausing orange-red females in soil cracks, ground litter, and greenhouse framework crevices.",
        },
        "prevention_practices": [
            "Avoid broad-spectrum pyrethroid insecticides that destroy beneficial predatory mites (e.g., Phytoseiulus persimilis, Neoseiulus californicus).",
            "Keep farm roadways and perimeter strips moist or vegetated to minimize dust blowing onto tomato rows.",
            "Ensure tomato plants are adequately watered; drought stress significantly increases susceptibility.",
            "Inspect transplants with a 10x-14x hand lens before bringing them into greenhouses or field beds.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Wash foliage with strong water sprays early in an infestation to dislodge mites and destroy webs (in home gardens).",
                "Pull and destroy heavily infested, webbed plants to prevent migration to adjacent rows.",
            ],
            "biological_and_protectant_measures": [
                "Release commercial predatory mites (Phytoseiulus persimilis or Neoseiulus californicus) early at the first sign of stippling in greenhouse/high tunnel crops.",
                "Apply insecticidal soaps, horticultural oils, or registered selective miticides targeting specific life stages as guided by extension pest advisories.",
            ],
            "cautionary_dosage_note": (
                "Spider mites rapidly develop resistance to chemical miticides. Never apply unregistered chemicals. Adhere strictly to label directions."
            ),
        },
        "severity_interpretation": {
            "mild": "Light stippling on a few lower leaves; no visible silken webbing. Controllable with predatory mite releases or insecticidal soap.",
            "severe": "Extensive bronzing and yellowing with thick silken webbing covering terminal shoots. High risk of complete plant desiccation.",
            "not_explicitly_graded": "Supports explicit Mild/Severe grading in the Stage 2 multi-crop severity model.",
        },
        "professional_advice_triggers": [
            "Dense silken webbing covers terminal growing shoots and flower clusters.",
            "Mite populations explode following recent application of broad-spectrum insecticides.",
        ],
        "sources": [
            {
                "title": "Two-Spotted Spider Mite Management Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/tomato/spider-mites/",
            },
            {
                "title": "Spider Mites on Tomato",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/",
            },
        ],
    },

    "Tomato___Target_Spot": {
        "raw_class": "Tomato___Target_Spot",
        "crop": "Tomato",
        "disease_name": "Target Spot",
        "is_healthy": False,
        "category": "Fungal",
        "causative_pathogen": {
            "scientific_name": "Corynespora cassiicola",
            "common_name": "Target spot fungus of tomato",
            "taxonomic_order_family": "Pleosporales: Corynesporascaceae",
        },
        "overview": (
            "Target spot of tomato is a destructive foliar and fruit disease common in warm, humid subtropical "
            "and tropical growing regions. It produces small, pinpoint brown spots that expand into circular lesions with "
            "pale brown centers and faint concentric rings. Unlike early blight, it readily affects leaves in all canopy zones "
            "as well as green and ripe fruit."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 28°C (68°F to 82°F)",
            "humidity_moisture": "High relative humidity (>80%) and prolonged periods of leaf wetness (heavy dew or frequent rainfall).",
            "soil_conditions": "Not soil-driven; favored by dense, humid canopies and poor air drainage.",
            "key_triggers": [
                "Warm, rainy subtropical weather with prolonged leaf wetness",
                "Dense, unpruned canopies trapping moisture",
                "Presence of alternate weed hosts (e.g., sicklepod, wild poinsettia)",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Initial symptoms are small, pinpoint water-soaked spots on upper leaf surfaces",
                "Spots expand into circular, necrotic brown lesions with lighter tan centers and dark margins",
                "Faint concentric rings may be visible inside larger lesions, giving a target-like appearance (often smaller and more numerous than early blight)",
                "Lesions can affect leaves throughout the middle and upper canopy, not just lower leaves",
                "Severe spotting causes extensive chlorosis, leaf blighting, and premature defoliation",
            ],
            "stem_and_fruit_symptoms": [
                "Fruit develops small, pinpoint brown lesions that become deeply pitted, circular craters with cracked centers",
                "Can occur on green and ripe fruit, destroying marketability",
            ],
            "progression": "Conidia infect leaves throughout the canopy; spores spread rapidly by wind and rain splash during warm, humid spells.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Airborne conidia carried by wind currents over substantial distances",
                "Splashing rain droplets and overhead irrigation",
            ],
            "survival_mechanism": "Has an extremely wide host range (over 500 plant species); overwinters in crop debris and on broadleaf weeds.",
        },
        "prevention_practices": [
            "Ensure generous plant spacing and prune suckers to optimize canopy air circulation and light penetration.",
            "Use drip irrigation under plastic mulch; avoid any overhead sprinkler watering.",
            "Control broadleaf weeds in and around fields that can harbor Corynespora cassiicola.",
            "Rotate away from solanaceous and cucurbit crops for at least 2 to 3 years.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Prune and destroy infected leaves during dry midday weather.",
                "Plow down or destroy crop residues immediately after final harvest.",
            ],
            "biological_and_protectant_measures": [
                "Apply registered preventative fungicides (e.g., chlorothalonil, mancozeb, or strobilurin/SDHI modes of action) as recommended by regional vegetable extension spray schedules.",
            ],
            "cautionary_dosage_note": (
                "Corynespora cassiicola has developed resistance to QoI (FRAC 11) fungicides in several regions. Follow university resistance management guidance. Never invent dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Scattered circular spots on a few leaves (<10% foliage); fruit clean. Controlled with canopy thinning and preventative protectant sprays.",
            "severe": "Widespread spotting across upper and middle canopy with deeply pitted lesions on green fruit. High commercial crop loss.",
            "not_explicitly_graded": "Single-stage classification in training data.",
        },
        "professional_advice_triggers": [
            "Circular pitted lesions appear on green developing fruit.",
            "Foliar spotting advances rapidly through upper canopy during warm, rainy weather.",
        ],
        "sources": [
            {
                "title": "Target Spot of Tomato",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/publication/PP154",
            },
            {
                "title": "Tomato Diseases: Target Spot",
                "organization": "Texas A&M AgriLife Extension",
                "url": "https://plantclinic.tamu.edu/",
            },
        ],
    },

    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "raw_class": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
        "crop": "Tomato",
        "disease_name": "Tomato Yellow Leaf Curl Virus",
        "is_healthy": False,
        "category": "Viral",
        "causative_pathogen": {
            "scientific_name": "Tomato yellow leaf curl virus (TYLCV)",
            "common_name": "Tomato yellow leaf curl begomovirus (transmitted by whitefly)",
            "taxonomic_order_family": "Monodnaviria: Geminiviridae: Begomovirus",
        },
        "overview": (
            "Tomato yellow leaf curl virus (TYLCV) is one of the most economically devastating viral diseases of tomato worldwide. "
            "Exclusively transmitted by the silverleaf whitefly (Bemisia tabaci), it causes dramatic upward cupping of leaves, "
            "interveinal chlorosis, severe plant stunting, flower abortion, and near-total yield loss when infection occurs early in plant growth."
        ),
        "favorable_conditions": {
            "temperature_range": "25°C to 35°C (77°F to 95°F) favors rapid reproduction and feeding activity of the whitefly vector",
            "humidity_moisture": "Warm, dry conditions favor whitefly population explosions; not dependent on rain or dew.",
            "soil_conditions": "Not soil-driven; vector-driven viral transmission.",
            "key_triggers": [
                "High silverleaf whitefly (Bemisia tabaci) populations in the field or surrounding crops",
                "Planting adjacent to maturing cotton, melon, or brassica crops that harbor whiteflies",
                "Planting non-resistant tomato varieties in endemic whitefly regions",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Pronounced upward curling and cupping of leaflet margins ('spoon-like' or boat-shaped leaves)",
                "Interveinal chlorosis (yellowing) with leaf margins turning pale yellow while main veins stay green",
                "Marked reduction in leaflet size; young leaves become puckered, leathery, and clustered",
                "Severe stunting of shoots, giving the plant a bushy, compact appearance",
            ],
            "stem_and_fruit_symptoms": [
                "Internodes are severely shortened",
                "Heavy flower drop (blossom abortion); plants infected prior to flowering produce virtually no harvestable fruit",
                "Fruit set prior to infection remains small and fails to color normally",
            ],
            "progression": "Whiteflies acquire the virus after 15-30 minutes of feeding and transmit it persistently; symptoms emerge in 2 to 3 weeks.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Silverleaf whitefly (Bemisia tabaci cryptic species complex) transmitting the virus persistently and circulative-manner",
                "Movement of infected greenhouse transplants carrying adult or nymph whiteflies",
            ],
            "survival_mechanism": "Survives in overlapping generations of whiteflies and in a broad range of alternate hosts (peppers, beans, weeds like nightshade and cheeseweed). Not seed-transmitted.",
        },
        "prevention_practices": [
            "Plant tomato cultivars bred with high TYLCV resistance (e.g., Ty-1, Ty-3, Ty-5 genes). Resistant cultivars represent the primary defense.",
            "Install 50-mesh insect screening on greenhouse and nursery vents to exclude whiteflies from seedling production.",
            "Use reflective silver or metallic plastic mulches in field plantings to disorient and repel incoming adult whiteflies.",
            "Maintain a host-free fallow period between crop cycles to break the continuous whitefly-virus reproduction chain.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Rogue (uproot) and bag infected plants displaying early symptoms during the first 30 days after transplanting to reduce field inoculum.",
                "Eradicate solanaceous weeds and volunteer tomatoes surrounding production fields.",
            ],
            "biological_and_protectant_measures": [
                "Manage whitefly vectors: apply systemic insecticides (e.g., neonicotinoids or diamides) at transplanting, followed by rotating foliar materials as guided by extension thresholds.",
                "Release biological control parasitoids (Encarsia formosa, Eretmocerus eremicus) in enclosed greenhouse systems.",
            ],
            "cautionary_dosage_note": (
                "There is no chemical cure for the plant once infected with TYLCV. All management focuses on prevention and vector control. Never invent chemical dosages."
            ),
        },
        "severity_interpretation": {
            "mild": "Early upward leaf cupping on a single branch; whitefly vector pressure detected. Immediate rogueing and vector treatment required.",
            "severe": "Widespread stunting, bushy growth, and complete blossom abortion across the field. Catastrophic yield loss if infected before flowering.",
            "not_explicitly_graded": "Single-stage classification in training data; presence confirmed.",
        },
        "professional_advice_triggers": [
            "Upward cupping and yellowing appear across multiple young plants within 3-4 weeks of transplanting.",
            "Dense clouds of whiteflies are observed fluttering when tomato foliage is disturbed.",
        ],
        "sources": [
            {
                "title": "Tomato Yellow Leaf Curl Virus Guidelines",
                "organization": "University of California IPM",
                "url": "https://ipm.ucanr.edu/agriculture/tomato/tomato-yellow-leaf-curl/",
            },
            {
                "title": "Tomato Yellow Leaf Curl Virus Management",
                "organization": "University of Florida IFAS Extension (EDIS)",
                "url": "https://edis.ifas.ufl.edu/publication/IN811",
            },
        ],
    },

    "Tomato___Tomato_mosaic_virus": {
        "raw_class": "Tomato___Tomato_mosaic_virus",
        "crop": "Tomato",
        "disease_name": "Tomato Mosaic Virus",
        "is_healthy": False,
        "category": "Viral",
        "causative_pathogen": {
            "scientific_name": "Tomato mosaic virus (ToMV)",
            "common_name": "Tomato mosaic tobamovirus (mechanically transmitted)",
            "taxonomic_order_family": "Kitrinoviricota: Virgaviridae: Tobamovirus",
        },
        "overview": (
            "Tomato mosaic virus (ToMV) is a highly stable, mechanically transmitted tobamovirus affecting tomatoes. "
            "It is closely related to Tobacco mosaic virus (TMV) and causes mottled light and dark green mosaic patterns on leaves, "
            "severe foliar distortion ('shoestringing'), plant stunting, and internal brown necrosis of fruit wall tissue."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 28°C (68°F to 82°F); the virus remains stable across wide temperature fluctuations",
            "humidity_moisture": "Not driven by humidity; spread entirely by physical touch and mechanical contact.",
            "soil_conditions": "Virus survives for years in dry root debris remaining in the soil.",
            "key_triggers": [
                "Pruning, suckering, and trellising plants without disinfecting tools or hands between plants",
                "Tobacco users handling tomato plants without washing hands",
                "Planting contaminated, uncertified seed",
            ],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Mottled light green and dark green mosaic patterns on leaflet surfaces",
                "Leaves become blistered, puckered, or distorted",
                "Severe strains cause extreme leaf narrowing, resulting in a thin, fern-like or 'shoestring' appearance",
                "Overall plant growth is stunted and foliage appears pale or chlorotic",
            ],
            "stem_and_fruit_symptoms": [
                "Stems can develop brown necrotic streaks in severe dual infections",
                "Fruit exhibits uneven ripening, yellowish blotches, and internal brown wall necrosis ('brownwall' or vascular browning) inside fruit flesh",
            ],
            "progression": "Systemic infection spreads rapidly through phloem transport following mechanical inoculation through microscopic cell wall wounds.",
        },
        "transmission_and_spread": {
            "primary_vectors": [
                "Mechanical transmission through workers' hands, pruning shears, harvesting tools, and stakes contacting sap",
                "Transmission via contaminated seed coat and grafting",
                "Contact with tobacco products (cigarettes, snuff) containing active viral particles",
            ],
            "survival_mechanism": "Remarkably durable; survives for years in dried plant debris, on wooden stakes, greenhouse structures, and in soil without losing infectivity.",
        },
        "prevention_practices": [
            "Plant resistant tomato cultivars with genetic ToMV resistance (Tm-2 or Tm-2^2 resistance genes).",
            "Use certified, hot-water or trisodium phosphate (TSP) treated seed.",
            "Strictly enforce handwashing with soap and water or 20% non-fat dry milk solution before handling tomato plants.",
            "Prohibit tobacco use anywhere near tomato production areas.",
            "Disinfect pruning shears, trellising tools, and stakes by soaking in a 10-20% household bleach solution or 20% non-fat dry milk solution.",
        ],
        "recommended_management": {
            "cultural_controls": [
                "Immediately pull and bag symptomatic plants as soon as mosaic symptoms appear; do not drag through the field.",
                "Do not compost infected plants; burn or dispose of them in municipal waste.",
            ],
            "biological_and_protectant_measures": [
                "There are no chemical or biological sprays that can cure a plant once infected with ToMV.",
                "Milk sprays (20% non-fat dry milk) applied to hands and tools during pruning can neutralize mechanical transmission.",
            ],
            "cautionary_dosage_note": (
                "No antiviral chemical treatments exist for plant viruses in field production. All management is preventative and sanitation-based."
            ),
        },
        "severity_interpretation": {
            "mild": "Faint mosaic mottling on a few young leaves; no stunting. Immediate plant removal and tool sanitization required.",
            "severe": "Widespread shoestring leaf distortion, severe plant stunting, and internal brown necrosis in developing fruit.",
            "not_explicitly_graded": "Single-stage classification in training data; presence confirmed.",
        },
        "professional_advice_triggers": [
            "Fern-like shoestringing or internal fruit browning spreads across multiple rows.",
            "Symptoms resemble Tomato Brown Rugose Fruit Virus (ToBRFV), which overcomes traditional Tm-2^2 resistance and requires regulatory PCR testing.",
        ],
        "sources": [
            {
                "title": "Tomato Mosaic Virus and Tobacco Mosaic Virus",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/tomato/tomato-mosaic-tobacco-mosaic/",
            },
            {
                "title": "Tomato Mosaic Virus",
                "organization": "Cornell University CALS Vegetable MD Online",
                "url": "https://vegetablemdonline.ppath.cornell.edu/",
            },
        ],
    },

    "Tomato___healthy": {
        "raw_class": "Tomato___healthy",
        "crop": "Tomato",
        "disease_name": "Healthy Tomato Specimen",
        "is_healthy": True,
        "category": "Healthy/Abiotic",
        "causative_pathogen": {
            "scientific_name": "None",
            "common_name": "Healthy tomato leaf tissue",
            "taxonomic_order_family": "None (Plantae: Solanaceae)",
        },
        "overview": (
            "The tomato foliage displays vibrant, uniform green coloration, intact compound leaflets with normal lobing, "
            "and an absence of concentric target spots (early blight), water-soaked blights (late blight), bacterial spots, "
            "or viral mosaic puckering. The photosynthetic canopy is functioning at optimal efficiency."
        ),
        "favorable_conditions": {
            "temperature_range": "20°C to 28°C (68°F to 82°F) optimal day; 16°C to 19°C (61°F to 66°F) night",
            "humidity_moisture": "Moderate relative humidity (55-70%) with good air movement and consistent drip irrigation.",
            "soil_conditions": "Deep, fertile, well-drained loam with pH 6.2 to 6.8 and balanced N-P-K plus adequate calcium.",
            "key_triggers": ["Raised plastic-mulched beds, trellising, consistent drip irrigation, and balanced nutrition."],
        },
        "characteristic_symptoms": {
            "foliar_symptoms": [
                "Deep green compound leaflets with natural lobing and smooth, clean margins",
                "No water-soaked spots, concentric target rings, or yellow halos",
                "Healthy leaf turgor and normal glandular pubescence",
            ],
            "stem_and_fruit_symptoms": [
                "Stems erect, stout, and green without dark cankers; blossoms setting cleanly",
                "Developing green fruit smooth and glossy without scab lesions, catfacing, or blossom-end rot",
            ],
            "progression": "Normal vegetative shoot growth, continuous flowering, and uniform fruit sizing.",
        },
        "transmission_and_spread": {
            "primary_vectors": ["None (healthy specimen)"],
            "survival_mechanism": "Not applicable.",
        },
        "prevention_practices": [
            "Prune lowest foliage 30 cm above the ground to eliminate soil contact as plants grow.",
            "Maintain drip irrigation under plastic mulch to prevent moisture fluctuation.",
            "Scout weekly for hornworms, aphids, whiteflies, and early leaf spots.",
        ],
        "recommended_management": {
            "cultural_controls": ["Continue routine trellising, suckering, and balanced fertility management."],
            "biological_and_protectant_measures": ["No agrochemical treatment required."],
            "cautionary_dosage_note": "No agrochemical treatment is indicated for healthy crop foliage.",
        },
        "severity_interpretation": {
            "mild": "Not applicable (healthy crop tissue; 0% disease progression).",
            "severe": "Not applicable.",
            "not_explicitly_graded": "Healthy class; no disease grading required.",
        },
        "professional_advice_triggers": [
            "Seek guidance if bottom-end fruit blackening (calcium-related blossom-end rot) or sudden bacterial wilt occurs.",
        ],
        "sources": [
            {
                "title": "Tomato Integrated Pest Management",
                "organization": "University of California IPM Guidelines",
                "url": "https://ipm.ucanr.edu/agriculture/tomato/",
            },
        ],
    },
}


# =============================================================================
# PUBLIC ACCESSOR AND UTILITY FUNCTIONS
# =============================================================================

def get_disease_info(raw_class: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the structured agricultural knowledge base entry for a given classifier class.
    
    Args:
        raw_class: Exact label from disease_classes.json (e.g. 'Tomato___Early_blight')
        
    Returns:
        Dictionary containing structured agronomic data, or None if class is unknown.
    """
    return DISEASE_KNOWLEDGE_BASE.get(raw_class)


def is_healthy_class(raw_class: str) -> bool:
    """
    Check whether a classifier class represents a healthy, non-pathological crop specimen.
    """
    entry = DISEASE_KNOWLEDGE_BASE.get(raw_class)
    if entry:
        return entry.get("is_healthy", False)
    return "healthy" in raw_class.lower()


def list_all_classes() -> List[str]:
    """Return all 38 raw class labels registered in the knowledge base."""
    return list(DISEASE_KNOWLEDGE_BASE.keys())


def list_healthy_classes() -> List[str]:
    """Return the list of all healthy class labels."""
    return [k for k, v in DISEASE_KNOWLEDGE_BASE.items() if v.get("is_healthy", False)]


def list_disease_classes() -> List[str]:
    """Return the list of all pathological (non-healthy) class labels."""
    return [k for k, v in DISEASE_KNOWLEDGE_BASE.items() if not v.get("is_healthy", False)]


def get_classes_by_category(category: str) -> List[str]:
    """
    Filter registered classes by taxonomic category:
    'Fungal', 'Bacterial', 'Viral', 'Oomycete', 'Pest/Arachnid', 'Healthy/Abiotic'.
    """
    return [k for k, v in DISEASE_KNOWLEDGE_BASE.items() if v.get("category", "").lower() == category.lower()]
