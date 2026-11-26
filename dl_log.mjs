// worker/hr-trips.js
var HR_TRIPS = { "i-tr102": "1840", "i-tr1031": "701", "i-tr1032": "702", "i-tr1033": "703", "i-tr1034": "7280", "i-tr1034ay": "7280", "i-tr1034az": "7280", "i-tr1035": "7281", "i-tr1035bb": "7281", "i-tr1035bc": "7281", "i-tr1036": "7282", "i-tr1036ba": "7282", "i-tr1036bz": "7282", "i-tr1037": "7283", "i-tr1037bd": "7283", "i-tr1037be": "7283", "i-tr1038": "7350", "i-tr1039": "7351", "i-tr1040": "7352", "i-tr1041": "7353", "i-tr1042": "740", "i-tr1045": "741", "i-tr1046": "742", "i-tr1047": "743", "i-tr1048": "744", "i-tr1049": "745", "i-tr1050": "746", "i-tr1052": "747", "i-tr1053": "748", "i-tr1054": "770", "i-tr1055": "432", "i-tr1056": "433", "i-tr1057": "434", "i-tr1058": "435", "i-tr1063": "771", "i-tr1064": "775", "i-tr1065": "78", "i-tr1066": "780", "i-tr1071": "7808", "i-tr1072": "7809", "i-tr1073": "781", "i-tr1074": "7812", "i-tr1075": "7813", "i-tr1076": "786", "i-tr1077": "787", "i-tr1079": "79", "i-tr1080": "790", "i-tr1081": "791", "i-tr1082": "792", "i-tr1083": "793", "i-tr1084": "795", "i-tr1085dq": "8000", "i-tr1085dr": "8000", "i-tr1086do": "8002", "i-tr1086dp": "8002", "i-tr1087": "8003", "i-tr1088": "8004", "i-tr1089ds": "8005", "i-tr1089dt": "8005", "i-tr1090": "8006", "i-tr1091": "8007", "i-tr1092": "8009", "i-tr1094eg": "8010", "i-tr1094eh": "8010", "i-tr1095": "8012", "i-tr1097du": "8013", "i-tr1097dv": "8013", "i-tr1098": "8014", "i-tr1099": "8015", "i-tr1099ea": "8015", "i-tr1099ez": "8015", "i-tr1100eb": "8016", "i-tr1100ec": "8016", "i-tr1100ed": "8016", "i-tr1101dw": "8017", "i-tr1101dx": "8017", "i-tr1102": "8018", "i-tr1102dy": "8018", "i-tr1103": "8019", "i-tr1104": "8020", "i-tr1104ew": "8020", "i-tr1105": "8021", "i-tr1106em": "8022", "i-tr1106en": "8022", "i-tr1107eo": "8023", "i-tr1107ep": "8023", "i-tr1108": "8024", "i-tr1109": "8025", "i-tr1110": "8026", "i-tr1110es": "8026", "i-tr1110et": "8026", "i-tr1111": "8027", "i-tr1111eu": "8027", "i-tr1111ev": "8027", "i-tr1112eq": "8028", "i-tr1112er": "8028", "i-tr1113": "8029", "i-tr1114": "8030", "i-tr1115": "8031", "i-tr1116": "8032", "i-tr1117": "8033", "i-tr1118": "8034", "i-tr1119": "8037", "i-tr1120fa": "8038", "i-tr1120fb": "8038", "i-tr1121ey": "8039", "i-tr1121fz": "8039", "i-tr1122fj": "8040", "i-tr1122fk": "8040", "i-tr1123fl": "8041", "i-tr1123fm": "8041", "i-tr1124": "8042", "i-tr1125": "8043", "i-tr1126ff": "8044", "i-tr1126fg": "8044", "i-tr1127": "8046", "i-tr1127fc": "8046", "i-tr1128fd": "8047", "i-tr1128fe": "8047", "i-tr1129": "8048", "i-tr1129fh": "8048", "i-tr1129fi": "8048", "i-tr1130": "8049", "i-tr1131fw": "8050", "i-tr1131fx": "8050", "i-tr1132ga": "8052", "i-tr1132gb": "8052", "i-tr1133fy": "8053", "i-tr1133gz": "8053", "i-tr1134fr": "8055", "i-tr1134fs": "8055", "i-tr1134ft": "8055", "i-tr1135fu": "8056", "i-tr1135fv": "8056", "i-tr1136fn": "8057", "i-tr1136fo": "8057", "i-tr1137": "8058", "i-tr1137fp": "8058", "i-tr1137fq": "8058", "i-tr1138": "8059", "i-tr1139": "8060", "i-tr1140": "8061", "i-tr1140ge": "8061", "i-tr1141gf": "8063", "i-tr1141gg": "8063", "i-tr1142": "8064", "i-tr1143": "8067", "i-tr1144": "8068", "i-tr1145gc": "8069", "i-tr1145gd": "8069", "i-tr1146": "8070", "i-tr1147gk": "8071", "i-tr1147gl": "8071", "i-tr1148gm": "8072", "i-tr1148gn": "8072", "i-tr1149gq": "8074", "i-tr1149gr": "8074", "i-tr1150go": "8075", "i-tr1150gp": "8075", "i-tr1151": "8076", "i-tr1152gi": "8077", "i-tr1152gj": "8077", "i-tr1153": "8078", "i-tr1154": "8080", "i-tr1155gu": "8081", "i-tr1155gv": "8081", "i-tr1156": "8082", "i-tr1157": "8083", "i-tr1158": "8085", "i-tr1159gw": "8087", "i-tr1159gx": "8087", "i-tr1160": "8089", "i-tr1160gt": "8089", "i-tr1161": "8091", "i-tr1178": "8180", "i-tr1179": "8181", "i-tr1180": "8182", "i-tr1181": "8183", "i-tr1182": "8184", "i-tr1183": "8185", "i-tr1184": "8186", "i-tr1197": "90010", "i-tr1198": "90020", "i-tr1199": "90030", "i-tr1200": "90040", "i-tr1201": "90050", "i-tr1202": "90060", "i-tr1203": "90070", "i-tr1204": "90080", "i-tr1205": "90090", "i-tr1207bl": "930", "i-tr1207bm": "930", "i-tr1208": "931", "i-tr1209": "932", "i-tr1210": "933", "i-tr1211": "934", "i-tr1212": "936", "i-tr1213": "940", "i-tr1215": "960", "i-tr1216": "961", "i-tr1217": "962", "i-tr1218": "963", "i-tr1221": "971", "i-tr1222": "973", "i-tr1223": "981", "i-tr1224": "982", "i-tr1225": "983", "i-tr1226cd": "984", "i-tr1226ce": "984", "i-tr1226cf": "984", "i-tr1227": "985", "i-tr1228": "986", "i-tr1229cg": "987", "i-tr1229ch": "987", "i-tr1229ci": "987", "i-tr1230": "988", "i-tr1231": "990", "i-tr1231cp": "990", "i-tr1232": "991", "i-tr1234": "993", "i-tr1236": "996", "i-tr1237": "94211", "i-tr1238": "94402", "i-tr1239": "94403", "i-tr1240": "94404", "i-tr1241": "94405", "i-tr1241ax": "94405", "i-tr1242": "94406", "i-tr1243": "94407", "i-tr1244": "94408", "i-tr1245": "94409", "i-tr1246": "94410", "i-tr1247": "94411", "i-tr1248": "94412", "i-tr1249": "94413", "i-tr1250": "94414", "i-tr1251": "94415", "i-tr1252": "94417", "i-tr1253": "21001", "i-tr1254": "21002", "i-tr1255": "21101", "i-tr1256": "21102", "i-tr1257": "1820", "i-tr1258": "1821", "i-tr1259": "18180", "i-tr1260": "18183", "i-tr1261": "18181", "i-tr1262": "1470", "i-tr1263": "1471", "i-tr1264": "1277", "i-tr1265": "5127", "i-tr1266": "15414", "i-tr1267": "15415", "i-tr1268": "15416", "i-tr1269": "15417", "i-tr127": "1880", "i-tr1270": "15418", "i-tr1271": "15419", "i-tr1272": "15421", "i-tr1273": "2170", "i-tr1274": "2179", "i-tr1275": "2230", "i-tr1276": "2235", "i-tr1277": "3074", "i-tr1278": "3075", "i-tr1279": "3144", "i-tr128": "1881", "i-tr1280": "3151", "i-tr1281": "4109", "i-tr1282": "4110", "i-tr1283": "5050", "i-tr1284": "5051", "i-tr1285": "15423", "i-tr129": "1950", "i-tr13": "1206", "i-tr130": "1951", "i-tr132bt": "2010", "i-tr132bu": "2010", "i-tr133": "2011", "i-tr134br": "2012", "i-tr134bs": "2012", "i-tr135": "2013", "i-tr136": "2014", "i-tr137": "2016", "i-tr138cb": "2017", "i-tr138cc": "2017", "i-tr139": "2018", "i-tr14": "18853", "i-tr140": "2019", "i-tr141": "2020", "i-tr142": "2021", "i-tr143ca": "2022", "i-tr143cz": "2022", "i-tr144": "2023", "i-tr144bx": "2023", "i-tr144by": "2023", "i-tr145cn": "2030", "i-tr145co": "2030", "i-tr146": "2031", "i-tr148": "18859", "i-tr149": "2100", "i-tr15": "18854", "i-tr150": "2102", "i-tr151": "2103", "i-tr152": "2104", "i-tr152ai": "2104", "i-tr153": "2105", "i-tr153ah": "2105", "i-tr154": "2107", "i-tr154ag": "2107", "i-tr155": "2109", "i-tr158": "18860", "i-tr159": "2111", "i-tr16": "1281", "i-tr162": "214", "i-tr163ar": "2171", "i-tr163as": "2171", "i-tr164ap": "2172", "i-tr164aq": "2172", "i-tr165": "2173", "i-tr167am": "2174", "i-tr167an": "2174", "i-tr168": "18861", "i-tr172": "2200", "i-tr173": "2201", "i-tr174": "2202", "i-tr175": "2203", "i-tr176": "2204", "i-tr177bj": "2205", "i-tr177bk": "2205", "i-tr178bh": "2206", "i-tr178bi": "2206", "i-tr179": "2207", "i-tr180": "2208", "i-tr181": "2209", "i-tr182": "2210", "i-tr183": "2211", "i-tr184": "2212", "i-tr185": "2213", "i-tr186": "2214", "i-tr187": "2214", "i-tr188": "2216", "i-tr191": "2250", "i-tr192": "2251", "i-tr193": "2253", "i-tr194aa": "2300", "i-tr194ab": "2300", "i-tr195": "2311", "i-tr196ac": "2313", "i-tr196ad": "2313", "i-tr197": "2320", "i-tr198": "2321", "i-tr199": "2323", "i-tr200": "2325", "i-tr201": "2330", "i-tr202": "2331", "i-tr203": "2332", "i-tr204": "2341", "i-tr205": "2350", "i-tr206": "2351", "i-tr207": "2380", "i-tr208": "2381", "i-tr209": "2382", "i-tr210": "2383", "i-tr211": "2384", "i-tr212": "2385", "i-tr213": "2410", "i-tr214": "2411", "i-tr215": "2450", "i-tr216": "2451", "i-tr217": "2452", "i-tr218": "2453", "i-tr219": "2454", "i-tr22": "1390", "i-tr220": "2455", "i-tr221": "2457", "i-tr222": "2500", "i-tr223": "2502", "i-tr224": "2503", "i-tr225": "2504", "i-tr226": "2505", "i-tr227": "2506", "i-tr228": "2507", "i-tr229": "2508", "i-tr23": "1391", "i-tr230": "2509", "i-tr231": "2510", "i-tr231gh": "2510", "i-tr232": "2511", "i-tr233": "2513", "i-tr234": "2515", "i-tr235": "2531", "i-tr236": "2551", "i-tr237": "2552", "i-tr238": "2553", "i-tr239": "2554", "i-tr24": "1472", "i-tr240": "2555", "i-tr241": "2600", "i-tr241bf": "2600", "i-tr242": "2601", "i-tr243": "2602", "i-tr244": "2603", "i-tr245": "2604", "i-tr246": "2605", "i-tr247": "2606", "i-tr248": "2607", "i-tr249": "2608", "i-tr25": "1473", "i-tr250": "2609", "i-tr251": "2610", "i-tr252": "2611", "i-tr253": "2612", "i-tr254": "2613", "i-tr254bg": "2613", "i-tr255": "2614", "i-tr256": "2615", "i-tr257": "2700", "i-tr258": "2701", "i-tr259": "2702", "i-tr26": "1474", "i-tr260": "2703", "i-tr261": "2704", "i-tr262": "2705", "i-tr263": "2706", "i-tr264": "2707", "i-tr265": "2709", "i-tr266": "2800", "i-tr267": "2801", "i-tr268": "2802", "i-tr269": "2803", "i-tr27": "1475", "i-tr270": "2804", "i-tr271": "2805", "i-tr272": "2806", "i-tr273": "2807", "i-tr274": "2808", "i-tr275": "2809", "i-tr276": "2900", "i-tr28": "18855", "i-tr280": "2901", "i-tr284": "2902", "i-tr285": "2903", "i-tr289": "2904", "i-tr29": "18856", "i-tr290": "2905", "i-tr3": "18850", "i-tr301": "2906", "i-tr312": "2907", "i-tr323": "2908", "i-tr333": "2909", "i-tr335": "2910", "i-tr336": "2911", "i-tr337": "2912", "i-tr343": "2913", "i-tr350": "2914", "i-tr354": "2915", "i-tr355": "2916", "i-tr364": "2917", "i-tr464": "3000", "i-tr465": "3001", "i-tr465aj": "3001", "i-tr466": "3002", "i-tr467": "3003", "i-tr468": "3004", "i-tr469": "3005", "i-tr47": "1701", "i-tr470": "3006", "i-tr471": "3007", "i-tr472ak": "3008", "i-tr472al": "3008", "i-tr473": "3009", "i-tr474": "3010", "i-tr475": "3011", "i-tr476": "3012", "i-tr477": "3013", "i-tr478": "3014", "i-tr479": "3015", "i-tr479au": "3015", "i-tr480": "3016", "i-tr481": "3017", "i-tr482": "3018", "i-tr482at": "3018", "i-tr483": "3020", "i-tr483ao": "3020", "i-tr484": "3022", "i-tr485": "3050", "i-tr486": "3051", "i-tr487": "3052", "i-tr488": "3053", "i-tr489": "3054", "i-tr490": "3055", "i-tr491": "3056", "i-tr492": "3057", "i-tr493": "3058", "i-tr494": "3059", "i-tr495": "3060", "i-tr496": "3061", "i-tr497": "3062", "i-tr498": "3063", "i-tr499": "3064", "i-tr5": "115", "i-tr500": "3065", "i-tr501": "3066", "i-tr502": "3067", "i-tr503": "3068", "i-tr504": "3069", "i-tr505": "3070", "i-tr506": "3071", "i-tr507": "3072", "i-tr508": "3073", "i-tr509": "3090", "i-tr510": "3110", "i-tr511": "3111", "i-tr512": "3112", "i-tr513": "3113", "i-tr514": "3114", "i-tr515": "3115", "i-tr516": "3116", "i-tr517": "3117", "i-tr518": "3118", "i-tr519": "3119", "i-tr52": "1748", "i-tr520": "3124", "i-tr521": "3125", "i-tr521ct": "3125", "i-tr522": "3126", "i-tr523cr": "3127", "i-tr523cs": "3127", "i-tr524": "3128", "i-tr525": "3129", "i-tr526": "3130", "i-tr527": "3131", "i-tr528": "3132", "i-tr529": "3133", "i-tr53": "1749", "i-tr530": "3134", "i-tr531": "3135", "i-tr532": "3136", "i-tr533": "3137", "i-tr534": "3138", "i-tr535": "3139", "i-tr536": "3140", "i-tr537": "3141", "i-tr538": "3142", "i-tr539": "3143", "i-tr54": "1750", "i-tr540": "3145", "i-tr541": "3147", "i-tr542": "3149", "i-tr543": "318", "i-tr544": "319", "i-tr545": "3210", "i-tr546": "3211", "i-tr547": "3212", "i-tr548": "3213", "i-tr549": "3214", "i-tr55": "1751", "i-tr550": "3215", "i-tr551": "3216", "i-tr552": "3217", "i-tr553": "3218", "i-tr554": "3219", "i-tr555": "3220", "i-tr556": "3221", "i-tr557": "3222", "i-tr558": "3223", "i-tr559": "3224", "i-tr56": "1753", "i-tr560": "3225", "i-tr561": "3226", "i-tr562": "3227", "i-tr563": "3228", "i-tr564": "3229", "i-tr565": "3230", "i-tr566": "3231", "i-tr567": "3232", "i-tr568": "3233", "i-tr569": "3235", "i-tr570": "3300", "i-tr571": "3301", "i-tr571bp": "3301", "i-tr572": "3302", "i-tr573": "3303", "i-tr574": "3304", "i-tr575": "3305", "i-tr576": "3306", "i-tr577": "3307", "i-tr577bo": "3307", "i-tr578": "3308", "i-tr579": "3309", "i-tr580": "3310", "i-tr580bn": "3310", "i-tr581": "3311", "i-tr582": "3312", "i-tr583": "3313", "i-tr584": "3314", "i-tr585": "3316", "i-tr586": "3318", "i-tr587": "3400", "i-tr588": "3401", "i-tr589": "3402", "i-tr590": "3403", "i-tr591": "3405", "i-tr592": "3407", "i-tr593": "3409", "i-tr594": "3411", "i-tr595": "3500", "i-tr596": "3501", "i-tr597": "3502", "i-tr598": "3503", "i-tr599": "3504", "i-tr6": "18851", "i-tr600": "3505", "i-tr601": "3506", "i-tr602": "3507", "i-tr603": "3508", "i-tr604": "3509", "i-tr605": "3510", "i-tr606": "3511", "i-tr607": "3513", "i-tr608": "3515", "i-tr609": "3600", "i-tr610": "3601", "i-tr611": "3602", "i-tr612": "3603", "i-tr613": "3604", "i-tr614": "3605", "i-tr615": "3606", "i-tr616": "3607", "i-tr617": "3608", "i-tr618": "3609", "i-tr619": "3610", "i-tr620": "3611", "i-tr621": "3612", "i-tr622": "3613", "i-tr623": "3614", "i-tr624": "3615", "i-tr625": "3616", "i-tr626": "3617", "i-tr627": "3618", "i-tr628": "3620", "i-tr629": "3800", "i-tr630": "3801", "i-tr631": "3802", "i-tr632": "3803", "i-tr633": "3804", "i-tr634": "3805", "i-tr634ex": "3805", "i-tr636": "390", "i-tr637": "3900", "i-tr638": "3901", "i-tr639": "3902", "i-tr640": "3903", "i-tr641": "3904", "i-tr642": "3905", "i-tr643": "3906", "i-tr644": "3907", "i-tr645": "391", "i-tr646": "392", "i-tr647": "393", "i-tr648": "4000", "i-tr649": "4001", "i-tr650": "4050", "i-tr651": "4051", "i-tr652": "4052", "i-tr653": "4053", "i-tr653dz": "4053", "i-tr654": "4054", "i-tr655": "4055", "i-tr655da": "4055", "i-tr656": "4056", "i-tr657": "4057", "i-tr658": "4058", "i-tr659": "4059", "i-tr660": "4060", "i-tr661": "4061", "i-tr662": "4062", "i-tr662db": "4062", "i-tr663": "4063", "i-tr664": "4064", "i-tr665": "4100", "i-tr666": "4101", "i-tr667": "4102", "i-tr668": "4103", "i-tr669": "4104", "i-tr670": "4105", "i-tr671": "4106", "i-tr672": "4107", "i-tr673": "4108", "i-tr674": "4124", "i-tr675": "414", "i-tr676": "415", "i-tr677": "4200", "i-tr678": "4201", "i-tr679": "4210", "i-tr680": "4212", "i-tr681": "4213", "i-tr682": "4215", "i-tr683": "4216", "i-tr684": "4220", "i-tr685": "4221", "i-tr686": "430", "i-tr687": "431", "i-tr688": "4600", "i-tr689": "4602", "i-tr690": "4603", "i-tr691": "4604", "i-tr692": "4605", "i-tr693": "4606", "i-tr694": "4607", "i-tr695": "4609", "i-tr696": "4700", "i-tr697": "4702", "i-tr698": "4703", "i-tr698gs": "4703", "i-tr699": "4704", "i-tr700": "4705", "i-tr701": "4706", "i-tr702": "4707", "i-tr703": "4708", "i-tr704": "4709", "i-tr705": "4710", "i-tr706": "4711", "i-tr707": "4712", "i-tr708": "4714", "i-tr709": "4715", "i-tr710": "4717", "i-tr712": "480", "i-tr714": "4800", "i-tr715": "4801", "i-tr716": "4802", "i-tr718": "4803", "i-tr720": "4804", "i-tr721": "4805", "i-tr722": "4806", "i-tr723": "4807", "i-tr724": "4808", "i-tr725": "4809", "i-tr727": "481", "i-tr728": "4810", "i-tr729": "4811", "i-tr730": "4812", "i-tr731": "4813", "i-tr733": "5000", "i-tr734": "5001", "i-tr735": "5002", "i-tr736": "5003", "i-tr737": "5004", "i-tr738": "5100", "i-tr739": "5101", "i-tr740": "5102", "i-tr740cu": "5102", "i-tr741": "5103", "i-tr742": "5104", "i-tr743": "5105", "i-tr744": "5106", "i-tr744cv": "5106", "i-tr745": "5107", "i-tr746": "5108", "i-tr747": "5109", "i-tr748": "5110", "i-tr749": "5111", "i-tr750": "5112", "i-tr751": "5113", "i-tr752": "5114", "i-tr753": "5115", "i-tr754": "5116", "i-tr755": "5117", "i-tr756": "5118", "i-tr757cx": "5119", "i-tr757cy": "5119", "i-tr758": "5120", "i-tr759": "5121", "i-tr759cw": "5121", "i-tr760": "5122", "i-tr761": "5123", "i-tr762": "5124", "i-tr763": "5125", "i-tr764": "520", "i-tr765": "5200", "i-tr766": "5201", "i-tr767": "5203", "i-tr768": "521", "i-tr769": "522", "i-tr770": "523", "i-tr771": "5300", "i-tr772": "5302", "i-tr773": "5400", "i-tr774": "5401", "i-tr775": "5402", "i-tr776": "5403", "i-tr777": "5404", "i-tr778": "5405", "i-tr779": "5406", "i-tr780": "5407", "i-tr781": "5500", "i-tr782": "5501", "i-tr783": "5502", "i-tr784": "5503", "i-tr784bq": "5503", "i-tr785": "5504", "i-tr786": "5505", "i-tr787": "5506", "i-tr788": "5507", "i-tr789": "5508", "i-tr790": "5509", "i-tr791": "5510", "i-tr792": "5511", "i-tr793": "5512", "i-tr794": "5513", "i-tr795": "5514", "i-tr796": "5515", "i-tr797": "5516", "i-tr798": "5517", "i-tr801": "5521", "i-tr802": "5522", "i-tr803": "5523", "i-tr804": "5524", "i-tr805": "5525", "i-tr806": "5526", "i-tr807": "5527", "i-tr808": "5528", "i-tr809": "5529", "i-tr810": "5530", "i-tr811": "5531", "i-tr812": "5532", "i-tr813": "5533", "i-tr814": "5534", "i-tr815": "5535", "i-tr816": "5536", "i-tr817": "5537", "i-tr818": "5538", "i-tr819": "5539", "i-tr820": "5540", "i-tr821": "5541", "i-tr822": "5542", "i-tr823": "5543", "i-tr824": "5544", "i-tr825": "5545", "i-tr826": "5546", "i-tr827": "5547", "i-tr828": "5549", "i-tr829": "5550", "i-tr830": "5551", "i-tr831": "5552", "i-tr832": "5571", "i-tr833": "5572", "i-tr834": "5574", "i-tr835": "5577", "i-tr836": "5580", "i-tr839": "580", "i-tr840": "5800", "i-tr841": "5801", "i-tr842": "5802", "i-tr843": "5803", "i-tr844": "5804", "i-tr845": "5805", "i-tr846": "5806", "i-tr847": "5807", "i-tr847gy": "5807", "i-tr848": "5809", "i-tr849": "581", "i-tr850": "5811", "i-tr851": "5820", "i-tr852": "5821", "i-tr853": "5822", "i-tr853ae": "5822", "i-tr854": "5823", "i-tr855": "5824", "i-tr856": "5825", "i-tr857": "5826", "i-tr858": "5827", "i-tr859": "5828", "i-tr860": "5829", "i-tr861": "5830", "i-tr862": "5831", "i-tr862af": "5831", "i-tr863": "5833", "i-tr864": "5835", "i-tr865dc": "6010", "i-tr865dd": "6010", "i-tr866": "6011", "i-tr867de": "6012", "i-tr867df": "6012", "i-tr868di": "6013", "i-tr868dj": "6013", "i-tr869dg": "6014", "i-tr869dh": "6014", "i-tr870": "6015", "i-tr871dk": "6016", "i-tr871dl": "6016", "i-tr872dm": "6017", "i-tr872dn": "6017", "i-tr873": "6050", "i-tr874": "6070", "i-tr875ei": "6071", "i-tr875ej": "6071", "i-tr876ee": "6072", "i-tr876ef": "6072", "i-tr877ek": "6073", "i-tr877el": "6073", "i-tr878": "6074", "i-tr879": "6075", "i-tr880": "6076", "i-tr881": "6100", "i-tr882": "6101", "i-tr883": "6130", "i-tr884": "6131", "i-tr885": "6133", "i-tr886": "6200", "i-tr887": "6201", "i-tr888": "6202", "i-tr889": "6203", "i-tr890": "6204", "i-tr891": "6205", "i-tr892": "6206", "i-tr893": "6207", "i-tr894": "6208", "i-tr895": "6209", "i-tr896": "6210", "i-tr897": "6211", "i-tr898": "6212", "i-tr899": "6213", "i-tr9": "18852", "i-tr90": "18857", "i-tr900": "6214", "i-tr901": "6215", "i-tr902": "6216", "i-tr903": "6217", "i-tr904": "6219", "i-tr905": "6300", "i-tr906av": "6301", "i-tr906aw": "6301", "i-tr907": "6306", "i-tr908": "6310", "i-tr909": "6311", "i-tr91": "18858", "i-tr910": "6320", "i-tr911": "6321", "i-tr912": "6322", "i-tr913": "6323", "i-tr914": "6324", "i-tr915": "6330", "i-tr916": "6331", "i-tr917": "6333", "i-tr918": "6400", "i-tr919": "6401", "i-tr919cq": "6401", "i-tr920": "6403", "i-tr921": "6410", "i-tr922": "6421", "i-tr923": "6430", "i-tr924": "6431", "i-tr925": "6432", "i-tr926": "6433", "i-tr927": "6434", "i-tr928": "6435", "i-tr929": "6437", "i-tr930": "6600", "i-tr931": "6601", "i-tr932": "6602", "i-tr933": "6603", "i-tr934": "6604", "i-tr935": "6605", "i-tr936": "6606", "i-tr937bv": "6607", "i-tr937bw": "6607", "i-tr938": "6608", "i-tr939": "6609", "i-tr940": "6610", "i-tr941": "6611", "i-tr942": "6612", "i-tr943": "6613", "i-tr944": "6614", "i-tr945": "6615", "i-tr946cj": "6616", "i-tr946ck": "6616", "i-tr947cl": "6617", "i-tr947cm": "6617", "i-tr948": "6618", "i-tr949": "6619", "i-tr950": "6620", "i-tr951": "6700", "i-tr952": "6701", "i-tr953": "6702", "i-tr954": "6703" };

// worker/fr.js
var URL_TU = "https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates";
var MAX_S = 8 * 3600;
var UA = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch)" };
var short = (id) => {
  const p = id.split(":");
  return p[0] + ":" + p.slice(-5).join(":");
};
function readTrips(b, nowS, first = false) {
  const dec = new TextDecoder();
  let p = 0;
  const varint = () => {
    let r = 0, s = 0, x;
    do {
      x = b[p++];
      r += (x & 127) * 2 ** s;
      s += 7;
    } while (x & 128);
    return r;
  };
  const skip = (wt) => {
    if (wt === 0) varint();
    else if (wt === 2) {
      const n = varint();
      p += n;
    } else if (wt === 1) p += 8;
    else if (wt === 5) p += 4;
    else throw new Error("wt " + wt);
  };
  const sub = () => {
    const n = varint();
    return p + n;
  };
  const int32 = () => {
    let r = 0, s = 0, x;
    do {
      x = b[p++];
      if (s < 32) r |= (x & 127) << s;
      s += 7;
    } while (x & 128);
    return r | 0;
  };
  const ev = (end) => {
    let d = null, t = 0;
    while (p < end) {
      const k = varint();
      if (k === 8) d = int32();
      else if (k === 16) t = varint();
      else skip(k & 7);
    }
    return [d, t];
  };
  const out = [];
  let ts = 0;
  while (p < b.length) {
    const tag = varint(), f = tag >>> 3, wt = tag & 7;
    if (f === 1 && wt === 2) {
      const hEnd = sub();
      while (p < hEnd) {
        const t = varint();
        if (t >>> 3 === 3 && (t & 7) === 0) ts = varint();
        else skip(t & 7);
      }
      p = hEnd;
      continue;
    }
    if (f !== 2 || wt !== 2) {
      skip(wt);
      continue;
    }
    const eEnd = sub();
    while (p < eEnd) {
      const t = varint();
      if (t >>> 3 === 3 && (t & 7) === 2) {
        const uEnd = sub();
        let id = "", canc = false, last = null, next = null, stt = "", sd = "";
        while (p < uEnd) {
          const u = varint(), uf = u >>> 3;
          if (uf === 1 && (u & 7) === 2) {
            const dEnd = sub();
            while (p < dEnd) {
              const d = varint(), df = d >>> 3;
              if (df === 1 && (d & 7) === 2) {
                const n = varint();
                id = dec.decode(b.subarray(p, p + n));
                p += n;
              } else if ((df === 2 || df === 3) && (d & 7) === 2) {
                const n = varint(), v = dec.decode(b.subarray(p, p + n));
                p += n;
                if (df === 2) stt = v;
                else sd = v;
              } else if (df === 4 && (d & 7) === 0) {
                if (varint() === 3) canc = true;
              } else skip(d & 7);
            }
            p = dEnd;
          } else if (uf === 2 && (u & 7) === 2) {
            const sEnd = sub();
            let a = [null, 0], d = [null, 0];
            while (p < sEnd) {
              const s = varint(), sf = s >>> 3;
              if (sf === 2 && (s & 7) === 2) a = ev(sub());
              else if (sf === 3 && (s & 7) === 2) d = ev(sub());
              else skip(s & 7);
            }
            p = sEnd;
            const dl = d[0] != null ? d[0] : a[0], tm = d[1] || a[1];
            if (dl != null) {
              const x = [dl, tm];
              last = x;
              if (!next && (first ? true : tm > nowS)) next = x;
            }
          } else skip(u & 7);
        }
        p = uEnd;
        if (id) {
          const c = next || last;
          out.push({ id, canc, delay: c ? c[0] : null, st: stt, sd });
        }
      } else skip(t & 7);
    }
    p = eEnd;
  }
  return { ts, trips: out };
}
async function frRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/fr/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/fr/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_TU, { headers: UA, signal: AbortSignal.timeout(8e3), cf: { cacheTtl: 20, cacheEverything: true } });
    if (!r.ok) throw new Error("SNCF " + r.status);
    const { ts, trips } = readTrips(new Uint8Array(await r.arrayBuffer()), Math.floor(Date.now() / 1e3));
    const d = {};
    for (const t of trips) {
      const o = d[short(t.id)] = [null, null, null, t.canc ? "C" : "R"];
      if (!t.canc && t.delay != null && t.delay >= -3600 && t.delay <= MAX_S) o[0] = Math.round(t.delay / 60);
    }
    let sj = {};
    try {
      if (env.DB) {
        const now = Date.now(), rows = (await env.DB.prepare("SELECT k, ts, body FROM live WHERE k IN ('fr:s','fr:active')").all()).results || [], by = new Map(rows.map((x) => [x.k, x]));
        const q = by.get("fr:s"), act = by.get("fr:active");
        if (q && now - q.ts < 10 * 6e4) sj = JSON.parse(q.body);
        if ((!act || now - act.ts > 5 * 6e4) && url.searchParams.get("p") !== "1") ctx.waitUntil(env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('fr:active', ?, '') ON CONFLICT(k) DO UPDATE SET ts = excluded.ts").bind(now).run().catch(() => {
        }));
      }
    } catch (e) {
    }
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d, s: sj });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/fr/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: 502, headers: head });
  }
}

// worker/rtx.js
var UA2 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)", "Accept-Encoding": "gzip" };
var FEEDS = {
  si: { urls: ["https://rt.gtfs.derp.si/sources/ijpp/trip_updates"], prefix: "si:" },
  sk: { urls: ["https://jbb.ghsq.de/gtfs/zsr/TripUpdates"], prefix: "" },
  ro: { urls: ["https://rt.gtfs.baguette.pirnet.si/gtfs-rt/cfr-ro/trip_updates.pb"], num: /-0*(\d+)$/ },
  pt: { urls: ["https://rt.gtfs.baguette.pirnet.si/gtfs-rt/cp/trip_updates.pb"], idre: /^(\d+)_/ },
  // CP: l'id e «numero_data»; il codice del nostro orario e il numero
  dk: { d1: "tt:dk-rt" },
  // Danimarca: SIRI-ET (40 MB) letto dal job tools/dk_rt.py e caricato con PUT /api/live/tt/dk-rt
  lv: { d1: "tt:lv-rt", eu: true },
  // eu: il job parte anche quando qualcuno apre la mappa d'Europa, senza scegliere il paese (richiesta del titolare, 16.11)
  // Lettonia: feed baltico di pieturas.lv (5 MB, tutti i mezzi) letto dal job tools/lv_rt.py: ritardi e GPS dei treni Vivi, PUT /api/live/tt/lv-rt
  at: { d1: "tt:at-rt" },
  // Austria, solo i treni della Stiria: GTFS-Realtime del Verkehrsverbund Steiermark (porte non raggiungibili dai Worker) letto dal job tools/at_rt.py
  hr: { urls: ["https://rt.gtfs.baguette.pirnet.si/gtfs-rt/HZPP/trip_updates.pb"], map: (id) => {
    const n = HR_TRIPS[id.replace(/_\d+$/, "")];
    return n ? "hr:" + n : null;
  } },
  // HŽPP (dal 24.11.2026): trip_id dell'orario ufficiale («i-tr1052_51») → numero del treno (worker/hr-trips.js, tools/hr_trips.py) = il nostro codice «hr:<numero>»
  hu: { urls: ["https://jbb.ghsq.de/gtfs/hu/1_198/trip-updates.pb", "https://jbb.ghsq.de/gtfs/hu/1_134/trip-updates.pb"], prefix: "hu:" }
};
async function rtxRt(cc, request, url, env, ctx) {
  const F = FEEDS[cc];
  if (!F) return new Response('{"error":"not_found"}', { status: 404 });
  if (F.d1) {
    const head2 = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" };
    if (!env.DB) return new Response('{"error":"not_configured"}', { status: 503, headers: head2 });
    const rows = (await env.DB.prepare("SELECT k, ts, body FROM live WHERE k IN (?, ?)").bind(F.d1, cc + ":active").all().catch(() => ({ results: [] }))).results || [];
    const act = rows.find((r) => r.k === cc + ":active"), now = Date.now();
    if ((!act || now - act.ts > 3 * 6e4) && ((request.headers.get("Referer") || "").includes("/" + cc) || (request.headers.get("Referer") || "").includes("/europe") && (F.eu || !url.searchParams.get("p")))) ctx.waitUntil(env.DB.prepare("INSERT INTO live (k, ts, body) VALUES (?, ?, '') ON CONFLICT(k) DO UPDATE SET ts = excluded.ts").bind(cc + ":active", now).run().catch(() => {
    }));
    const row = rows.find((r) => r.k === F.d1);
    return new Response(row && row.body && now - row.ts < 30 * 6e4 ? row.body : JSON.stringify({ ts: 0, d: {} }), { headers: head2 });
  }
  const cache = caches.default, key = new Request(url.origin + "/api/" + cc + "/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/" + cc + "/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const d = {};
    let ts = 0, ok = 0, err = "";
    await Promise.all(F.urls.map(async (u) => {
      try {
        const r = await fetch(u, { headers: UA2, signal: AbortSignal.timeout(8e3), cf: { cacheTtl: 20, cacheEverything: true } });
        if (!r.ok) throw new Error(new URL(u).host + " " + r.status);
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf.length < 30) return;
        const x = readTrips(buf, Math.floor(Date.now() / 1e3), true);
        ok++;
        if (x.ts > ts) ts = x.ts;
        for (const t of x.trips) {
          let k;
          if (F.map) {
            k = F.map(t.id);
            if (!k) continue;
          } else if (F.idre) {
            const m = F.idre.exec(t.id);
            if (!m) continue;
            k = m[1];
          } else if (F.num) {
            const m = F.num.exec(t.id);
            if (!m) continue;
            k = "n:" + m[1];
          } else k = (F.prefix || "") + t.id;
          const o = [null, null, null, t.canc ? "C" : "R"];
          if (!t.canc && t.delay != null && t.delay >= -3600 && t.delay <= 8 * 3600) o[0] = Math.round(t.delay / 60);
          if (!(d[k] && d[k][0] != null && o[0] == null && !t.canc)) d[k] = o;
        }
      } catch (e) {
        err = String(e.message || e).slice(0, 100);
      }
    }));
    if (!ok) throw new Error(err || "nessun dato");
    if (!Object.keys(d).length && stale) return stale;
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/" + cc + "/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: url.searchParams.get("dbg") ? 200 : 502, headers: head });
  }
}

// worker/es.js
var BASE = "https://gtfsrt.renfe.com/";
var FEEDS2 = ["vehicle_positions", "vehicle_positions_LD", "trip_updates", "trip_updates_LD"];
var UA3 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch)", Accept: "application/json" };
var FGC = "https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/";
async function getFgc(name) {
  const meta = await (await fetch(FGC + name + "/records?limit=1", { headers: UA3, signal: AbortSignal.timeout(6e3) })).json();
  const url = meta.results && meta.results[0] && meta.results[0].file && meta.results[0].file.url;
  if (!url) throw new Error(name + ": nessun file");
  const r = await fetch(url, { headers: UA3, signal: AbortSignal.timeout(6e3) });
  if (!r.ok) throw new Error(name + " " + r.status);
  return new Uint8Array(await r.arrayBuffer());
}
function pb(buf, onField) {
  let p = 0;
  const varint = () => {
    let r = 0, s = 0, x;
    do {
      x = buf[p++];
      r += (x & 127) * 2 ** s;
      s += 7;
    } while (x & 128);
    return r;
  };
  while (p < buf.length) {
    const tag = varint(), f = tag >>> 3, wt = tag & 7;
    if (wt === 0) onField(f, 0, varint());
    else if (wt === 2) {
      const n = varint();
      onField(f, 2, buf.subarray(p, p + n));
      p += n;
    } else if (wt === 5) {
      onField(f, 5, new DataView(buf.buffer, buf.byteOffset + p, 4).getFloat32(0, true));
      p += 4;
    } else if (wt === 1) p += 8;
    else throw new Error("wt " + wt);
  }
}
var txt = (b) => new TextDecoder().decode(b);
function fgcVehicles(buf) {
  const out = [];
  pb(buf, (f, wt, v) => {
    if (f !== 2 || wt !== 2) return;
    pb(v, (f2, w2, v2) => {
      if (f2 !== 4 || w2 !== 2) return;
      let trip = "", lat = null, lon = null;
      pb(v2, (f3, w3, v3) => {
        if (f3 === 1 && w3 === 2) pb(v3, (a, b, c) => {
          if (a === 1 && b === 2) trip = txt(c);
        });
        else if (f3 === 2 && w3 === 2) pb(v3, (a, b, c) => {
          if (a === 1 && b === 5) lat = c;
          else if (a === 2 && b === 5) lon = c;
        });
      });
      if (trip && lat != null && lon != null) out.push({ trip, lat, lon });
    });
  });
  return out;
}
function fgcUpdates(buf) {
  const out = [];
  pb(buf, (f, wt, v) => {
    if (f !== 2 || wt !== 2) return;
    pb(v, (f2, w2, v2) => {
      if (f2 !== 3 || w2 !== 2) return;
      let trip = "", canc = false, first = null;
      pb(v2, (f3, w3, v3) => {
        if (f3 === 1 && w3 === 2) pb(v3, (a, b, c) => {
          if (a === 1 && b === 2) trip = txt(c);
          else if (a === 4 && b === 0 && c === 3) canc = true;
        });
        else if (f3 === 2 && w3 === 2 && !first) {
          let stop = "", time = 0;
          pb(v3, (a, b, c) => {
            if (a === 4 && b === 2) stop = txt(c);
            else if ((a === 2 || a === 3) && b === 2 && !time) pb(c, (x, y, z) => {
              if (x === 2 && y === 0) time = z;
            });
          });
          if (stop && time) first = { stop, time };
        }
      });
      if (trip && (first || canc)) out.push({ trip, canc, stop: first && first.stop, time: first && first.time });
    });
  });
  return out;
}
async function getFeed(name) {
  const r = await fetch(BASE + name + ".json", { headers: UA3, signal: AbortSignal.timeout(6e3), cf: { cacheTtl: 20, cacheEverything: true } });
  if (!r.ok) throw new Error(name + " " + r.status);
  return r.json();
}
async function esRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/es/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/es/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const got = await Promise.allSettled(FEEDS2.map(getFeed)), ok = got.map((g) => g.status === "fulfilled" ? g.value : { entity: [], header: {} });
    if (got.every((g) => g.status !== "fulfilled")) throw new Error("nessun file di Renfe");
    const [vp, vl, tu, tl] = ok;
    const d = {};
    const at = (id) => d[id] = d[id] || [null, null, null, "R"];
    for (const f of [tu, tl]) {
      for (const e of f.entity || []) {
        const t = e.tripUpdate;
        if (!t || !t.trip) continue;
        const o = at(t.trip.tripId);
        if (t.trip.scheduleRelationship === "CANCELED") {
          o[3] = "C";
          continue;
        }
        const su = (t.stopTimeUpdate || [])[0] || {};
        const dl = t.delay != null ? +t.delay : su.arrival && su.arrival.delay != null ? +su.arrival.delay : su.departure && su.departure.delay != null ? +su.departure.delay : null;
        if (dl != null && isFinite(dl)) {
          let x = dl < -43200 ? dl + 86400 : dl;
          if (x >= -3600 && x <= 8 * 3600) o[0] = Math.round(x / 60);
        }
      }
    }
    for (const f of [vp, vl]) {
      for (const e of f.entity || []) {
        const v = e.vehicle;
        if (!v || !v.trip || !v.position) continue;
        const o = at(v.trip.tripId);
        o[1] = +(+v.position.latitude).toFixed(5);
        o[2] = +(+v.position.longitude).toFixed(5);
      }
    }
    try {
      const [bv, bu] = await Promise.all([getFgc("vehicle-positions-gtfs_realtime"), getFgc("trip-updates-gtfs_realtime")]);
      for (const v of fgcVehicles(bv)) {
        const o = at(v.trip);
        o[1] = +v.lat.toFixed(5);
        o[2] = +v.lon.toFixed(5);
      }
      for (const u of fgcUpdates(bu)) {
        const o = at(u.trip);
        if (u.canc) o[3] = "C";
        else o[4] = [u.stop, u.time];
      }
    } catch (e) {
    }
    const ts = Math.max(+(tu.header || {}).timestamp || 0, +(tl.header || {}).timestamp || 0, +(vp.header || {}).timestamp || 0, +(vl.header || {}).timestamp || 0) * 1e3;
    const body = JSON.stringify({ ts: Date.now(), feed: ts, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/es/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: 502, headers: head });
  }
}

// worker/nl.js
var URL_TU2 = "https://gtfs.ovapi.nl/nl/trainUpdates.pb";
var UA4 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)", "Accept-Encoding": "gzip" };
async function nlRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/nl/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/nl/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_TU2, { headers: UA4, signal: AbortSignal.timeout(8e3), cf: { cacheTtl: 20, cacheEverything: true } });
    if (!r.ok) throw new Error("OVapi " + r.status);
    const { ts, trips } = readTrips(new Uint8Array(await r.arrayBuffer()), Math.floor(Date.now() / 1e3));
    const d = {};
    for (const t of trips) {
      const o = d[t.id] = [null, null, null, t.canc ? "C" : "R"];
      if (!t.canc && t.delay != null && t.delay >= -3600 && t.delay <= 8 * 3600) o[0] = Math.round(t.delay / 60);
    }
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/nl/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: 502, headers: head });
  }
}

// worker/pl.js
var URL_TU3 = "https://mkuran.pl/gtfs/polish_trains/updates.pb";
var UA5 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)", "Accept-Encoding": "gzip" };
function readPl(b, nowS) {
  const dec = new TextDecoder();
  let p = 0;
  const varint = () => {
    let r = 0, s = 0, x;
    do {
      x = b[p++];
      r += (x & 127) * 2 ** s;
      s += 7;
    } while (x & 128);
    return r;
  };
  const sub = () => {
    const n = varint();
    return p + n;
  };
  const skip = (wt) => {
    if (wt === 0) {
      while (b[p++] & 128) ;
    } else if (wt === 2) {
      const n = varint();
      p += n;
    } else if (wt === 1) p += 8;
    else if (wt === 5) p += 4;
    else throw new Error("wt " + wt);
  };
  const out = {};
  let ts = 0;
  while (p < b.length) {
    const tag = varint(), f = tag >>> 3, wt = tag & 7;
    if (f === 1 && wt === 2) {
      const n = varint(), end = p + n;
      while (p < end) {
        const t = varint();
        if (t >>> 3 === 3 && (t & 7) === 0) ts = varint();
        else skip(t & 7);
      }
      p = end;
      continue;
    }
    if (f !== 2 || wt !== 2) {
      skip(wt);
      continue;
    }
    const eEnd = sub();
    while (p < eEnd) {
      const t = varint();
      if (!(t >>> 3 === 3 && (t & 7) === 2)) {
        skip(t & 7);
        continue;
      }
      const uEnd = sub();
      let id = "", canc = false;
      const offs = [];
      while (p < uEnd) {
        const u = varint(), uf = u >>> 3;
        if (uf === 1 && (u & 7) === 2) {
          const dEnd = sub();
          while (p < dEnd) {
            const d = varint(), df = d >>> 3;
            if (df === 1 && (d & 7) === 2) {
              const n2 = varint();
              id = dec.decode(b.subarray(p, p + n2));
              p += n2;
            } else if (df === 4 && (d & 7) === 0) {
              if (varint() === 3) canc = true;
            } else skip(d & 7);
          }
          p = dEnd;
        } else if (uf === 2 && (u & 7) === 2) {
          const e2 = sub();
          offs.push(p, e2);
          p = e2;
        } else skip(u & 7);
      }
      if (!id || id.startsWith("U_")) continue;
      const stu = (i) => {
        p = offs[2 * i];
        const sEnd = offs[2 * i + 1];
        let seq = -1, ta = 0, td = 0;
        while (p < sEnd) {
          const s = varint(), sf = s >>> 3;
          if (sf === 1 && (s & 7) === 0) seq = varint();
          else if ((sf === 2 || sf === 3) && (s & 7) === 2) {
            const e3 = sub();
            while (p < e3) {
              const e = varint();
              if (e >>> 3 === 2 && (e & 7) === 0) {
                const v = varint();
                if (sf === 2) ta = v;
                else td = v;
              } else skip(e & 7);
            }
            p = e3;
          } else skip(s & 7);
        }
        return [seq, ta || td];
      };
      const n = offs.length / 2;
      let nextSeq = -1, nextT = 0, lastSeq = -1, lastT = 0;
      if (n) {
        const f0 = stu(0), l0 = stu(n - 1);
        lastSeq = l0[0];
        lastT = l0[1];
        if (!canc && (f0[1] > nowS + 3 * 3600 || lastT < nowS - 2 * 3600)) {
          p = uEnd;
          continue;
        }
        let lo = 0, hi = n - 1;
        while (lo < hi) {
          const mid = lo + hi >> 1;
          if (stu(mid)[1] >= nowS - 60) hi = mid;
          else lo = mid + 1;
        }
        const c = stu(lo);
        if (c[1] >= nowS - 60) {
          nextSeq = c[0];
          nextT = c[1];
        }
      }
      p = uEnd;
      out[id] = canc ? [null, null, null, "C"] : nextSeq >= 0 ? [null, null, null, "R", nextSeq, nextT] : [null, null, null, "R", lastSeq, lastT];
    }
  }
  return { ts, d: out };
}
async function plRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/pl/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/pl/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_TU3, { headers: UA5, signal: AbortSignal.timeout(1e4), cf: { cacheTtl: 30, cacheEverything: true } });
    if (!r.ok) throw new Error("mkuran " + r.status);
    const { ts, d } = readPl(new Uint8Array(await r.arrayBuffer()), Math.floor(Date.now() / 1e3));
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=60" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/pl/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=900" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: 502, headers: head });
  }
}

// worker/cz.js
var URL_TU4 = "https://motis.obehy.cz/get-feeds/cz-czptt-gtfs-rt.pb";
var UA6 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)" };
var PFX = "czptt:trip:";
async function czRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/cz/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/cz/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_TU4, { headers: UA6, signal: AbortSignal.timeout(1e4) });
    if (!r.ok) throw new Error("obehy " + r.status);
    const buf = new Uint8Array(await r.arrayBuffer());
    if (!/protobuf|octet/.test(r.headers.get("content-type") || "")) throw new Error("tipo " + (r.headers.get("content-type") || "?") + " " + new TextDecoder().decode(buf.subarray(0, 80)).replace(/\s+/g, " "));
    const { ts, d } = readPl(buf, Math.floor(Date.now() / 1e3));
    const out = {};
    for (const [k, v] of Object.entries(d)) out[k.startsWith(PFX) ? k.slice(PFX.length) : k] = v;
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d: out });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=60" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/cz/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=900" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: url.searchParams.get("dbg") ? 200 : 502, headers: head });
  }
}

// worker/bg.js
var URL_TU5 = "https://gtfs.livetransport.eu/gtfs-rt/bdz.pb";
var UA7 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)", "Accept-Encoding": "gzip" };
async function bgRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/bg/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/bg/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_TU5, { headers: UA7, signal: AbortSignal.timeout(8e3), cf: { cacheTtl: 20, cacheEverything: true } });
    if (!r.ok) throw new Error("livetransport.eu " + r.status);
    const { ts, trips } = readTrips(new Uint8Array(await r.arrayBuffer()), Math.floor(Date.now() / 1e3));
    const d = {};
    for (const t of trips) {
      const o = d[t.id] = [null, null, null, t.canc ? "C" : "R"];
      if (!t.canc && t.delay != null && t.delay >= -3600 && t.delay <= 8 * 3600) o[0] = Math.round(t.delay / 60);
    }
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/bg/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: 502, headers: head });
  }
}

// worker/ie.js
var json = (obj, status = 200, extra) => new Response(typeof obj === "string" ? obj : JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
async function ieLive(request, url, env, ctx) {
  if (request.method !== "GET") return json({ error: "method" }, 405);
  if (!env.DB) return json({ error: "not_configured" }, 503);
  const now = Date.now();
  const rows = (await env.DB.prepare("SELECT k, ts, body FROM live WHERE k IN ('ie:p','ie:d0','ie:d1','ie:active')").all()).results || [];
  const by = new Map(rows.map((r) => [r.k, r]));
  const act = by.get("ie:active");
  if ((!act || now - act.ts > 5 * 6e4) && url.searchParams.get("p") !== "1") ctx.waitUntil(env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('ie:active', ?, '') ON CONFLICT(k) DO UPDATE SET ts = excluded.ts").bind(now).run().catch(() => {
  }));
  const p = by.get("ie:p");
  const fresh = p && now - p.ts < 10 * 6e4;
  const pos = fresh ? JSON.parse(p.body) : {}, d = {};
  for (const h of ["ie:d0", "ie:d1"]) {
    const r = by.get(h);
    if (r && now - r.ts < 15 * 6e4) Object.assign(d, JSON.parse(r.body));
  }
  const out = {};
  for (const [code, v] of Object.entries(pos)) out[code] = [d[code] ?? null, v[0], v[1], v[2]];
  return json({ ts: p ? p.ts : 0, fresh: !!fresh, d: out }, 200, { "Cache-Control": fresh ? "public, max-age=30" : "no-store" });
}

// worker/lu.js
var API = "https://cdt.hafas.de/opendata/apiserver/departureBoard";
var LU_HUBS = ["200405060", "220102018", "220402046", "140701022", "220902007", "180703009", "191103004", "110606008"];
var FRESH = 175e3;
var KEEP = 90 * 6e4;
var DAY_MAX = 4500;
var HEAD = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" };
function readBoard(j) {
  const out = {};
  for (const x of j && j.Departure || []) {
    const p = x.ProductAtStop || x.Product && x.Product[0] || {}, num = String(p.num || "").trim();
    if (num.length < 3 || !/^\d+$/.test(num) || !x.date || !x.time) continue;
    if (x.cancelled === true || x.cancelled === "true") {
      out[num] = [null, "C"];
      continue;
    }
    if (!x.rtTime) {
      if (!(num in out)) out[num] = [null, "R"];
      continue;
    }
    const m = Math.round((Date.parse((x.rtDate || x.date) + "T" + x.rtTime + "Z") - Date.parse(x.date + "T" + x.time + "Z")) / 6e4);
    if (m >= -30 && m <= 360) out[num] = [m, "R"];
  }
  return out;
}
async function luRt(request, url, env, ctx) {
  if (!env.DB) return new Response('{"error":"not_configured"}', { status: 503, headers: HEAD });
  const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
  const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = 'lu:rt'").first().catch(() => null);
  let st = { d: {}, day, n: 0 };
  try {
    if (row && row.body) st = JSON.parse(row.body);
  } catch (e) {
  }
  if (st.day !== day) {
    st.day = day;
    st.n = 0;
  }
  const pub = () => {
    const d2 = {};
    for (const k in st.d) {
      const v = st.d[k];
      if (now - v[2] < KEEP) d2["lu:" + k] = [v[0], null, null, v[1]];
    }
    return new Response(JSON.stringify({ ts: row ? row.ts : 0, d: d2 }), { headers: HEAD });
  };
  const ref = request.headers.get("Referer") || "", watched = ref.includes("/lu") || ref.includes("/europe");
  if (!env.MOBILITEIT_KEY || row && now - row.ts < FRESH || !watched || st.n + LU_HUBS.length > DAY_MAX) return pub();
  const claim = await env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('lu:rt', ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts WHERE live.ts = ?").bind(now, JSON.stringify(st), row ? row.ts : 0).run().catch(() => null);
  if (!claim || !claim.meta || !claim.meta.changes) return pub();
  let ok = 0;
  await Promise.all(LU_HUBS.map(async (id) => {
    try {
      const r = await fetch(API + "?accessId=" + encodeURIComponent(env.MOBILITEIT_KEY) + "&lang=fr&id=" + id + "&format=json", { headers: { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)" }, signal: AbortSignal.timeout(8e3) });
      if (!r.ok) return;
      const b = readBoard(await r.json());
      ok++;
      for (const num in b) {
        const o = st.d[num];
        if (b[num][0] == null && b[num][1] === "R" && o && o[0] != null && now - o[2] < 10 * 6e4) continue;
        st.d[num] = [b[num][0], b[num][1], now];
      }
    } catch (e) {
    }
  }));
  st.n += LU_HUBS.length;
  for (const k in st.d) if (now - st.d[k][2] > KEEP) delete st.d[k];
  const save = env.DB.prepare("UPDATE live SET ts = ?, body = ? WHERE k = 'lu:rt'").bind(ok ? now : now - FRESH + 6e4, JSON.stringify(st)).run().catch(() => {
  });
  if (ctx && ctx.waitUntil) ctx.waitUntil(save);
  else await save;
  const d = {};
  for (const k in st.d) d["lu:" + k] = [st.d[k][0], null, null, st.d[k][1]];
  return new Response(JSON.stringify({ ts: ok || !row ? now : row.ts, d }), { headers: HEAD });
}

// worker/be.js
var API2 = "https://api.irail.be/v1/liveboard/";
var BMC = "https://api-management-discovery-production.azure-api.net/api/gtfs/feed/nmbssncb/rt/trip-update?unroll=false&format=protobuf";
var BE_HUBS = [
  "8812005",
  "8821121",
  "8841004",
  "8811916",
  "8872009",
  "8892007",
  "8833001",
  "8881000",
  "8200100",
  "8863008",
  "8866605",
  "8814415",
  "8811601",
  "8896008",
  "8895505",
  "8882107",
  "8865003",
  "8891009",
  "8844206",
  "8822004",
  "8821063",
  "8831005",
  "8864501",
  "8866001",
  "8892601",
  "8873007",
  "8833605",
  "8883006",
  "8400424",
  "8871605",
  "8895802",
  "8885068",
  "8861317",
  "8895125",
  "8884004",
  "8821659",
  "8865300",
  "8843307",
  "8845005",
  "8811676"
];
var GROUP = 8;
var FRESH2 = 1e5;
var FRESH_O = 6e4;
var KEEP2 = 90 * 6e4;
var PAUSE = 10 * 6e4;
var UA8 = "RailPulse/1.0 (railpulse.ch; railpulse.ch@gmail.com)";
var HEAD2 = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" };
function readBoard2(j) {
  const out = {};
  const dep = j && j.departures && j.departures.departure;
  for (const x of Array.isArray(dep) ? dep : dep ? [dep] : []) {
    const v = x.vehicleinfo || {}, num = String(v.number || String(x.vehicle || "").replace(/^.*?(\d+)$/, "$1") || "").replace(/^0+/, "");
    if (!/^\d{2,6}$/.test(num)) continue;
    if (String(x.canceled) === "1") {
      out[num] = [null, "C"];
      continue;
    }
    const m = Math.round(Number(x.delay || 0) / 60);
    if (isFinite(m) && m >= -30 && m <= 360) out[num] = [m, "R"];
  }
  return out;
}
function midBxl(sd) {
  const noon = Date.UTC(+sd.slice(0, 4), +sd.slice(4, 6) - 1, +sd.slice(6, 8), 12);
  const h = +new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(noon)).find((x) => x.type === "hour").value;
  return noon / 1e3 - (h - 12) * 3600 - 12 * 3600;
}
function readBmc(buf, nowS) {
  const { ts, trips } = readTrips(buf, nowS), out = {}, mids = {};
  for (const t of trips) {
    const p = t.id.split(":");
    if (p.length < 7 || !/^\d{7}$/.test(p[5]) || !/^\d{7}$/.test(p[6]) || !/^\d{8}$/.test(t.sd) || !/^\d{1,2}:\d\d:\d\d$/.test(t.st)) continue;
    const [h, m, sec] = t.st.split(":").map(Number), mid = mids[t.sd] != null ? mids[t.sd] : mids[t.sd] = midBxl(t.sd);
    const k = p[5] + "|" + p[6] + "|" + (mid + h * 3600 + m * 60 + sec);
    if (t.canc) {
      out[k] = [null, "C"];
      continue;
    }
    if (t.delay == null) continue;
    const mm = Math.round(t.delay / 60);
    if (mm >= -30 && mm <= 360) out[k] = [mm, "R"];
  }
  return { ts, d: out };
}
async function beRt(request, url, env, ctx) {
  if (!env.DB) return new Response('{"error":"not_configured"}', { status: 503, headers: HEAD2 });
  const now = Date.now();
  const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = 'be:rt'").first().catch(() => null);
  let st = { d: {}, o: {}, g: 0, pause: 0, iAt: 0 };
  try {
    if (row && row.body) st = Object.assign(st, JSON.parse(row.body));
  } catch (e) {
  }
  const pub = (ts) => {
    const d = {};
    for (const k in st.d) {
      const v = st.d[k];
      if (now - v[2] < KEEP2) d["be:" + k] = [v[0], null, null, v[1]];
    }
    for (const k in st.o || {}) {
      const v = st.o[k];
      if (now - v[2] < KEEP2) d["be:o:" + k] = [v[0], null, null, v[1]];
    }
    return new Response(JSON.stringify({ ts, d }), { headers: HEAD2 });
  };
  const ref = request.headers.get("Referer") || "", watched = ref.includes("/be") || ref.includes("/europe") || ref.includes("/journey");
  const key = env.BMC_KEY || "";
  if (row && now - row.ts < (key ? FRESH_O : FRESH2) || !watched || !key && now < (st.pause || 0)) return pub(row ? row.ts : 0);
  const claim = await env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('be:rt', ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts WHERE live.ts = ?").bind(now, JSON.stringify(st), row ? row.ts : 0).run().catch(() => null);
  if (!claim || !claim.meta || !claim.meta.changes) return pub(row ? row.ts : 0);
  let ok = 0, lim = false;
  if (key) {
    try {
      const r = await fetch(BMC, { headers: { "Ocp-Apim-Subscription-Key": key, "User-Agent": UA8, Accept: "application/x-protobuf" }, signal: AbortSignal.timeout(1e4) });
      if (r.ok) {
        const x = readBmc(new Uint8Array(await r.arrayBuffer()), Math.floor(now / 1e3));
        st.o = st.o || {};
        for (const k in x.d) st.o[k] = [x.d[k][0], x.d[k][1], now];
        ok++;
        st.oErr = 0;
      } else st.oErr = r.status;
    } catch (e) {
      st.oErr = "net";
    }
  }
  const doI = now >= (st.pause || 0) && (!key || now - (st.iAt || 0) >= FRESH2);
  const g = (st.g | 0) % Math.ceil(BE_HUBS.length / GROUP), ids = doI ? BE_HUBS.slice(g * GROUP, g * GROUP + GROUP) : [];
  await Promise.all(ids.map(async (id) => {
    try {
      const r = await fetch(API2 + "?id=BE.NMBS.00" + id + "&format=json&lang=en&alerts=false", { headers: { "User-Agent": UA8, Accept: "application/json" }, signal: AbortSignal.timeout(8e3) });
      if (r.status === 429) {
        lim = true;
        return;
      }
      if (!r.ok) return;
      const b = readBoard2(await r.json());
      ok++;
      for (const num in b) {
        const o = st.d[num];
        if (b[num][0] == null && b[num][1] === "R" && o && o[0] != null && now - o[2] < 10 * 6e4) continue;
        st.d[num] = [b[num][0], b[num][1], now];
      }
    } catch (e) {
    }
  }));
  if (doI) {
    st.g = g + 1;
    st.iAt = now;
  }
  if (lim) st.pause = now + PAUSE;
  for (const k in st.d) if (now - st.d[k][2] > KEEP2) delete st.d[k];
  for (const k in st.o || {}) if (now - st.o[k][2] > KEEP2) delete st.o[k];
  const save = env.DB.prepare("UPDATE live SET ts = ?, body = ? WHERE k = 'be:rt'").bind(ok ? now : now - (key ? FRESH_O : FRESH2) + 6e4, JSON.stringify(st)).run().catch(() => {
  });
  if (ctx && ctx.waitUntil) ctx.waitUntil(save);
  else await save;
  return pub(ok || !row ? now : row.ts);
}

// worker/at-hubs.js
var AT_HUBS = [["1191201", "49:1015", "Wien Meidling"], ["1292001", "49:1705", "Wien Handelskai"], ["1191401", "49:560", "Wien H\xFCtteldorf"], ["8100108", "47:1187", "Innsbruck Hauptbahnhof"], ["1290401", "49:1349", "Wien Hauptbahnhof"], ["1191901", "49:491", "Wien Heiligenstadt"], ["892048", "48:454", "Bregenz Riedenburg"], ["8100002", "45:50002", "Salzburg Hauptbahnhof"], ["1260107", "46:4498", "Graz Don Bosco"], ["8100147", "42:3654", "Villach Hauptbahnhof"], ["8100013", "44:41164", "Linz/Donau Hauptbahnhof"], ["8100516", "43:5210", "Wiener Neustadt Hauptbahnhof"], ["8100070", "46:6344", "Leoben Hauptbahnhof"], ["1132419", "43:4710", "Schwechat"], ["8100014", "44:42107", "Wels Hauptbahnhof"], ["8100515", "41:4473", "Parndorf Ort"], ["1241604", "44:44001", "Puchenau West Bahnhst"], ["8100099", "47:1170", "W\xF6rgl Hauptbahnhof"], ["1230509", "43:7242", "St. Valentin"], ["8100085", "42:3642", "Klagenfurt Hauptbahnhof"], ["8000320", "Pde:09163:9", "Rosenheim"], ["891423", "48:187", "St. Anton im Montafon"], ["1292106", "49:176", "Wien Br\xFCnner Stra\xDFe"], ["8100109", "47:1189", "Innsbruck Westbahnhof"], ["1141225", "44:48000", "Ried im Innkreis"], ["1131912", "43:8003", "Herzogenburg"], ["1250328", "45:56483", "Stra\xDFwalchen West"], ["1131508", "43:7435", "Erlauf"], ["1130615", "43:3766", "Hirtenberg"], ["1141703", "44:47200", "Attnang-Puchheim"], ["1130502", "43:7234", "Amstetten"], ["1292207", "49:910", "Wien Aspern Nord"], ["1150619", "45:54001", "Saalfelden"], ["1170752", "47:3878", "Tassenbach"], ["1170327", "47:2263", "Matrei a. Br."], ["8101640", "43:4995", "Traiskirchen Aspangbahn"], ["1140614", "44:45090", "Pregarten"], ["1241009", "44:41600", "Traun O\xD6"], ["8101135", "44:47271", "Lenzing O\xD6 Ort Bahnhst"], ["8100382", "42:3657", "Villach Warmbad"], ["1131911", "43:7224", "Gro\xDF Sierning"], ["1161512", "46:1752", "Weitersfeld an der Mur"], ["1132306", "43:7032", "Bad Erlach"], ["1241503", "44:46940", "Kastenreith Bahnhst"], ["1160209", "46:6092", "Kapfenberg"], ["1132357", "43:7097", "Oberpiesting"], ["1110801", "41:3294", "Deutschkreutz"], ["1110504", "41:7075", "Jennersdorf"], ["5501494", "Phu:08518:27001898", "Sopron"], ["1220603", "42:2128", "Spittal-Millst\xE4tter See"], ["1241101", "44:44410", "Mauthausen O\xD6"], ["1132351", "43:8022", "Brunn an der Schneebergbahn Bhf."], ["1180404", "48:817", "Feldkirch"], ["5695603", "sk:56:7", "Dev\xEDnska Nov\xE1 Ves"], ["8100470", "42:3843", "Maria Rain"], ["1231805", "43:8763", "Payerbach-Reichenau"], ["1141426", "44:48790", "Taufkirchen/Pram"], ["1292103", "49:769", "Wien Leopoldau"], ["1220601", "42:2121", "Mallnitz-Obervellach"], ["5600207", "Psk:56:1", "Bratislava hl.st."], ["1240711", "44:46440", "Ebensee Landungsplatz Bahnhst"], ["1250404", "45:52205", "B\xF6ckstein"], ["1192301", "49:788", "Wien Liesing"], ["1120409", "42:3820", "Grafenstein"], ["8101946", "44:42268", "Wels Messe"], ["5402728", "cz:0:5475232", "Rybn\xEDk"], ["1132307", "43:3415", "Felixdorf"], ["8096701", "Pde:09172:42293", "Freilassing"], ["1131230", "43:4884", "Stockerau"], ["5400018", "cz:0:5473632", "\u010Cesk\xE9 Velenice"], ["1131413", "43:7381", "Traisen"], ["1260603", "46:1760", "Peggau-Deutschfeistritz"], ["8300076", "Pit:22021:998", "Bressanone, Stazione di Bressanone"], ["1150404", "45:52099", "Bischofshofen"], ["1291106", "49:1257", "Wien Grillgasse"], ["1250302", "45:50290", "Stra\xDFwalchen"], ["1131310", "43:3493", "Gedersdorf"], ["8598527", "fl:21:1371", "Nendeln"], ["5400121", "cz:1:5436955", "Znojmo"], ["8509411", "Pch:1:sloid", "Sargans"]];

// worker/at.js
var SB = "https://fahrplan.oebb.at/bin/stboard.exe/dn?L=vs_java3&time=now&productsFilter=1011110000001000&maxJourneys=60&start=yes&selectDate=today&evaId=";
var GROUP2 = 8;
var FRESH3 = 45e3;
var KEEP3 = 90 * 6e4;
var PAUSE2 = 30 * 6e4;
var UA9 = "RailPulse/1.0 (railpulse.ch; railpulse.ch@gmail.com)";
var HEAD3 = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" };
function readScotty(xml) {
  const out = {};
  for (const m of String(xml).matchAll(/<Journey\s([^>]*?)\/?>/g)) {
    const a = {};
    for (const x of m[1].matchAll(/(\w+)="([^"]*)"/g)) a[x[1]] = x[2];
    const cat = String(a.prod || "").split("#")[1] || "";
    const rid = a.realtimeID || "";
    let num = "";
    const p = /^(\d+)-/.exec(rid);
    if (p) num = p[1].replace(/^0+/, "");
    else {
      const c = /^COMP-([A-Z]+)(\d+)-/.exec(rid);
      if (c && c[1] === cat) num = c[2];
    }
    if (!/^[A-Z]{1,4}$/.test(cat) || !/^\d{1,6}$/.test(num)) continue;
    const d = String(a.delay || "").trim();
    if (/cancel/i.test(d)) {
      out[cat + num] = [null, "C"];
      continue;
    }
    if (d === "-" || d === "") continue;
    let mm = a.e_delay != null && a.e_delay !== "" ? Number(a.e_delay) : Number(d.replace(/[+\s]/g, ""));
    if (!isFinite(mm) || mm < -30 || mm > 360) continue;
    out[cat + num] = [Math.round(mm), "R"];
  }
  return out;
}
async function atRt(request, url, env, ctx) {
  if (!env.DB) return new Response('{"error":"not_configured"}', { status: 503, headers: HEAD3 });
  const now = Date.now();
  let base = { ts: 0, d: {} };
  try {
    base = await (await rtxRt("at", request, url, env, ctx)).json();
  } catch (e) {
  }
  const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = 'at:sc'").first().catch(() => null);
  let st = { d: {}, g: 0, pause: 0, err: 0 };
  try {
    if (row && row.body) st = Object.assign(st, JSON.parse(row.body));
  } catch (e) {
  }
  const pub = (ts) => {
    const d = Object.assign({}, base.d || {});
    for (const k in st.d) {
      const v = st.d[k];
      if (now - v[2] < KEEP3) d["#" + k] = [v[0], null, null, v[1]];
    }
    return new Response(JSON.stringify({ ts: Math.max(ts || 0, base.ts || 0), d }), { headers: HEAD3 });
  };
  const ref = request.headers.get("Referer") || "";
  const log = (request.headers.get("User-Agent") || "") === "railpulse-log";
  const watched = log || ref.includes("/at") || ref.includes("/journey") || ref.includes("/europe") && !url.searchParams.get("p");
  if (row && now - row.ts < FRESH3 || !watched || now < (st.pause || 0) || !AT_HUBS.length) return pub(row ? row.ts : 0);
  const claim = await env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('at:sc', ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts WHERE live.ts = ?").bind(now, JSON.stringify(st), row ? row.ts : 0).run().catch(() => null);
  if (!claim || !claim.meta || !claim.meta.changes) return pub(row ? row.ts : 0);
  const n = Math.ceil(AT_HUBS.length / GROUP2), g = (st.g | 0) % n, ids = AT_HUBS.slice(g * GROUP2, g * GROUP2 + GROUP2 * (log ? 2 : 1));
  let ok = 0, block = false;
  const got = {};
  await Promise.all(ids.flatMap((h) => ["arr", "dep"].map((bt) => [h, bt])).map(async ([h, bt]) => {
    try {
      const r = await fetch(SB + h[0] + "&boardType=" + bt, { headers: { "User-Agent": UA9 }, signal: AbortSignal.timeout(8e3) });
      if (r.status === 403 || r.status === 429) {
        block = true;
        st.err = r.status;
        return;
      }
      if (!r.ok) {
        st.err = r.status;
        return;
      }
      const xml = new TextDecoder("latin1").decode(await r.arrayBuffer());
      if (!/<Journey\s|<StationTable|<\?xml/.test(xml)) {
        st.err = "html";
        return;
      }
      const b = readScotty(xml);
      ok++;
      for (const k in b) if (bt === "dep" || !got[k]) got[k] = b[k];
    } catch (e) {
      st.err = "net";
    }
  }));
  for (const k in got) st.d[k] = [got[k][0], got[k][1], now];
  st.g = g + (log ? 2 : 1);
  if (block) st.pause = now + PAUSE2;
  if (!ok && !block) {
    st.fail = (st.fail | 0) + 1;
    st.pause = now + Math.min(PAUSE2, 5 * 6e4 * 2 ** (st.fail - 1));
  } else if (ok) st.fail = 0;
  if (ok) st.err = 0;
  for (const k in st.d) if (now - st.d[k][2] > KEEP3) delete st.d[k];
  const save = env.DB.prepare("UPDATE live SET ts = ?, body = ? WHERE k = 'at:sc'").bind(now, JSON.stringify(st)).run().catch(() => {
  });
  if (ctx && ctx.waitUntil) ctx.waitUntil(save);
  else await save;
  return pub(now);
}

// worker/ee.js
var URL_VP = "https://jbb.ghsq.de/gtfs/elron/VehiclePositions";
var UA10 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)" };
function readVp(b, prefix = "ee:") {
  const dec = new TextDecoder(), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), d = {};
  let p = 0, ts = 0;
  const varint = () => {
    let r = 0, s = 0, x;
    do {
      x = b[p++];
      r += (x & 127) * 2 ** s;
      s += 7;
    } while (x & 128);
    return r;
  };
  const skip = (wt) => {
    if (wt === 0) varint();
    else if (wt === 2) {
      const n = varint();
      p += n;
    } else if (wt === 1) p += 8;
    else if (wt === 5) p += 4;
    else throw new Error("wt " + wt);
  };
  while (p < b.length) {
    const tag = varint(), f = tag >>> 3, wt = tag & 7;
    if (f === 1 && wt === 2) {
      const n2 = varint(), end = p + n2;
      while (p < end) {
        const t = varint();
        if (t >>> 3 === 3 && (t & 7) === 0) ts = varint();
        else skip(t & 7);
      }
      p = end;
      continue;
    }
    if (f !== 2 || wt !== 2) {
      skip(wt);
      continue;
    }
    const n = varint(), eEnd = p + n;
    let tid = "", lat = null, lon = null;
    while (p < eEnd) {
      const t = varint();
      if (!(t >>> 3 === 4 && (t & 7) === 2)) {
        skip(t & 7);
        continue;
      }
      const vEnd = p + varint();
      while (p < vEnd) {
        const u = varint();
        if (u >>> 3 === 1 && (u & 7) === 2) {
          const tEnd = p + varint();
          while (p < tEnd) {
            const v = varint();
            if (v >>> 3 === 1 && (v & 7) === 2) {
              const m = varint();
              tid = dec.decode(b.subarray(p, p + m));
              p += m;
            } else skip(v & 7);
          }
        } else if (u >>> 3 === 2 && (u & 7) === 2) {
          const pEnd = p + varint();
          while (p < pEnd) {
            const v = varint();
            if ((v >>> 3 === 1 || v >>> 3 === 2) && (v & 7) === 5) {
              const x = dv.getFloat32(b.byteOffset + p, true);
              p += 4;
              if (v >>> 3 === 1) lat = x;
              else lon = x;
            } else skip(v & 7);
          }
        } else if (u >>> 3 === 5 && (u & 7) === 0) {
          const s = varint();
          if (s > ts) ts = s;
        } else skip(u & 7);
      }
    }
    if (tid && lat != null && lon != null && Math.abs(lat) > 1) d[prefix + tid] = [null, Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5, "R"];
  }
  return { ts, d };
}
async function eeRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/ee/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/ee/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_VP, { headers: UA10, signal: AbortSignal.timeout(8e3) });
    if (!r.ok) throw new Error("jbb " + r.status);
    const { ts, d } = readVp(new Uint8Array(await r.arrayBuffer()));
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/ee/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: url.searchParams.get("dbg") ? 200 : 502, headers: head });
  }
}

// worker/gr.js
var URL_VP2 = "https://jbb.ghsq.de/gtfs/railway-gov-gr/VehiclePositions";
var UA11 = { "User-Agent": "RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)" };
async function grRt(request, url, env, ctx) {
  const cache = caches.default, key = new Request(url.origin + "/api/gr/rt?v=1");
  const hit = await cache.match(key);
  if (hit) return hit;
  const stale = await cache.match(new Request(url.origin + "/api/gr/rt?stale=1"));
  const head = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    const r = await fetch(URL_VP2, { headers: UA11, signal: AbortSignal.timeout(8e3) });
    if (!r.ok) throw new Error("jbb " + r.status);
    const { ts, d } = readVp(new Uint8Array(await r.arrayBuffer()), "gr:");
    const body = JSON.stringify({ ts: Date.now(), feed: ts * 1e3, d });
    const res = new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=30" } });
    ctx.waitUntil(Promise.all([cache.put(key, res.clone()), cache.put(new Request(url.origin + "/api/gr/rt?stale=1"), new Response(body, { headers: { ...head, "Cache-Control": "public, max-age=600" } }))]));
    return res;
  } catch (e) {
    if (stale) return stale;
    return new Response(JSON.stringify({ error: "upstream", detail: String(e.message || e).slice(0, 120) }), { status: url.searchParams.get("dbg") ? 200 : 502, headers: head });
  }
}

// log/index.js
var ORIGIN = "https://railpulse.ch";
var H = {
  es: esRt,
  fr: frRt,
  nl: nlRt,
  pl: plRt,
  cz: czRt,
  bg: bgRt,
  ie: (r, u, e, c) => ieLive(r, u, e, c),
  gr: grRt,
  ee: eeRt,
  be: (r, u, e, c) => beRt(new Request(r.url, { headers: { "User-Agent": "railpulse-log", Referer: ORIGIN + "/europe" } }), u, e, c),
  // Belgio: iRail si rilegge solo con un Referer del sito (worker/be.js)
  at: (r, u, e, c) => atRt(new Request(r.url, { headers: { "User-Agent": "railpulse-log" } }), u, e, c),
  // Austria: Stiria (D1) + partenze di Scotty di ÖBB, due gruppi di stazioni per giro (worker/at.js)
  lu: (r, u, e, c) => luRt(new Request(r.url, { headers: { "User-Agent": "railpulse-log", Referer: ORIGIN + "/europe" } }), u, e, c)
};
var GPS = /* @__PURE__ */ new Set(["gr", "ee"]);
for (const cc of ["si", "sk", "ro", "pt", "hu", "hr"]) H[cc] = (r, u, e, c) => rtxRt(cc, r, u, e, c);
var D1 = { de: "tt:de-rt", it: "tt:it-rt", dk: "tt:dk-rt", lv: "tt:lv-rt", uk: "tt:uk-rt", no: "tt:no-rt" };
var GROUPS = [["es", "si", "sk", "ie"], ["fr", "bg", "lu", "be"], ["nl", "ro", "fi", "hr"], ["pl", "gr", "at"], ["cz", "pt", "hu", "ee"], ["de", "it", "dk", "lv", "uk", "no"], ["se", "at"]];
var KEEP_MS = 14 * 864e5;
function ukBoardDelays(rows, now) {
  const out = {}, seen = {};
  for (const r of rows || []) {
    if (!r || !r.body || now - r.ts > 10 * 6e4) continue;
    let list;
    try {
      list = JSON.parse(r.body);
    } catch (e) {
      continue;
    }
    for (const t of list) {
      if (!t || !t.k || !Array.isArray(t.s) || !t.s.length || (seen[t.k] || 0) > r.ts) continue;
      if (t.c) {
        if (!seen[t.k]) out["b:" + t.k] = [null, null, null, "C"];
        continue;
      }
      let x = t.s.find((p) => p[2] * 1e3 > now) || t.s[t.s.length - 1];
      const m = Math.round((x[2] - x[1]) / 60);
      if (!(m >= -30 && m <= 600)) continue;
      out["b:" + t.k] = [m, null, null, "R"];
      seen[t.k] = r.ts;
    }
  }
  return out;
}
async function ukBoards(env) {
  const rs = await env.DB.prepare("SELECT ts, body FROM live WHERE k LIKE 'uk:h:%'").all().catch(() => null);
  const d = ukBoardDelays(rs && rs.results, Date.now());
  return Object.keys(d).length ? d : null;
}
function valOf(v, gps) {
  if (!Array.isArray(v)) return JSON.stringify([v == null ? null : v]);
  const o = [v[0] == null ? null : v[0], v[3] || "R"];
  if (gps && v[1] != null && v[2] != null) o.push(Math.round(v[1] * 1e3) / 1e3, Math.round(v[2] * 1e3) / 1e3);
  for (let i = 4; i < v.length; i++) o.push(v[i]);
  return JSON.stringify(o);
}
function diff(prev, cur, sec) {
  const lines = [], next = {};
  for (const k in cur) {
    const v = cur[k];
    next[k] = v;
    if (prev[k] !== v) lines.push(sec + "	" + k + "	" + v);
  }
  for (const k in prev) if (!(k in cur)) lines.push(sec + "	" + k + "	-");
  return { lines, next };
}
function seTrains(j) {
  const ms = (s) => Date.parse(s), by = /* @__PURE__ */ new Map();
  for (const r of ((j.RESPONSE || {}).RESULT || [{}])[0].TrainAnnouncement || []) {
    if (!r.AdvertisedTimeAtLocation || !r.LocationSignature) continue;
    const k = r.AdvertisedTrainIdent + "|" + String(r.ScheduledDepartureDateTime || "").slice(0, 10);
    (by.get(k) || by.set(k, []).get(k)).push(r);
  }
  const d = {};
  for (const [k, g] of by) {
    g.sort((a, b) => ms(a.AdvertisedTimeAtLocation) - ms(b.AdvertisedTimeAtLocation) || (a.ActivityType === "Ankomst" ? -1 : 1));
    const end = g[g.length - 1];
    if (end.TimeAtLocation) continue;
    if (g.every((r) => r.Canceled)) {
      d[k] = [null, null, null, "C"];
      continue;
    }
    let at = null;
    for (const r of g) if (r.TimeAtLocation) at = r;
    if (at) {
      d[k] = [Math.round((ms(at.TimeAtLocation) - ms(at.AdvertisedTimeAtLocation)) / 6e4), null, null, "R", at.LocationSignature];
      continue;
    }
    const e = g.find((r) => r.EstimatedTimeAtLocation);
    d[k] = [e ? Math.round((ms(e.EstimatedTimeAtLocation) - ms(e.AdvertisedTimeAtLocation)) / 6e4) : null, null, null, "R", ""];
  }
  return d;
}
function fiTrains(all) {
  const d = {};
  let ver = 0;
  for (const t of all) {
    if (t.version > ver) ver = t.version;
    const k = t.trainNumber + "|" + t.departureDate, rows = t.timeTableRows || [];
    if (!(t.trainCategory === "Commuter" || t.trainCategory === "Long-distance") || rows.length < 2) {
      d[k] = null;
      continue;
    }
    if (rows[rows.length - 1].actualTime) {
      d[k] = null;
      continue;
    }
    if (t.cancelled) {
      d[k] = [null, null, null, "C"];
      continue;
    }
    let at = null;
    for (const r of rows) if (r.actualTime) at = r;
    if (at) {
      d[k] = [at.differenceInMinutes != null ? at.differenceInMinutes : null, null, null, "R", at.stationShortCode];
      continue;
    }
    const e = rows.find((r) => r.liveEstimateTime && r.differenceInMinutes != null);
    d[k] = [e ? e.differenceInMinutes : null, null, null, "R", ""];
  }
  return { d, ver };
}
async function fiCurrent(env) {
  const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = 'dl:v:fi'").first().catch(() => null);
  let v = null;
  try {
    v = row ? JSON.parse(row.body) : null;
  } catch (e) {
    v = null;
  }
  const full = !v || !v.ver || Date.now() - v.full > 3 * 36e5;
  const r = await fetch("https://rata.digitraffic.fi/api/v1/live-trains?version=" + (full ? 0 : v.ver), { headers: { "Digitraffic-User": "railpulse", "Accept-Encoding": "gzip" }, signal: AbortSignal.timeout(2e4) });
  if (!r.ok) throw new Error("Digitraffic " + r.status);
  const x = fiTrains(await r.json());
  const ver = Math.max(x.ver, full ? 0 : v.ver);
  await env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('dl:v:fi', ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts, body = excluded.body").bind(Date.now(), JSON.stringify({ ver, full: full ? Date.now() : v.full })).run();
  return { d: x.d, merge: !full };
}
var VIA = { be: ORIGIN + "/europe", lu: ORIGIN + "/europe", at: "", ie: "" };
async function current(cc, env, ctx) {
  if (cc === "fi") return fiCurrent(env);
  if (env.VIA_SITE && cc in VIA) {
    const h = { "User-Agent": "railpulse-log" };
    if (VIA[cc]) h.Referer = VIA[cc];
    const r2 = await fetch(ORIGIN + "/api/" + cc + (cc === "ie" ? "/live" : "/rt") + "?p=1", { headers: h, signal: AbortSignal.timeout(4e4) });
    if (!r2.ok) throw new Error("HTTP " + r2.status);
    return (await r2.json()).d || {};
  }
  if (cc === "se") {
    const r2 = await fetch(ORIGIN + "/api/se/ann", { headers: { "User-Agent": "railpulse-log" }, signal: AbortSignal.timeout(2e4) });
    if (!r2.ok) throw new Error("HTTP " + r2.status);
    return seTrains(await r2.json());
  }
  if (D1[cc]) {
    const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = ?").bind(D1[cc]).first();
    const old = !row || !row.body || Date.now() - row.ts > (cc === "uk" ? 100 : 30) * 6e4;
    if (cc !== "uk") return old ? null : JSON.parse(row.body).d || {};
    const d2 = old ? {} : JSON.parse(row.body).d || {}, b = await ukBoards(env);
    if (old && !b) return null;
    return Object.assign(d2, b || {});
  }
  const url = new URL(ORIGIN + "/api/" + cc + "/rt?p=1");
  const r = await H[cc](new Request(url, { headers: { "User-Agent": "railpulse-log" } }), url, env, ctx);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json(), d = j.d || {};
  if (j.s) for (const k in j.s) d["s:" + k] = j.s[k];
  return d;
}
async function one(cc, env, ctx, now, st) {
  const t0 = Date.now();
  try {
    let d = await current(cc, env, ctx);
    if (!d) {
      st[cc] = [now, 0, 0, 0, "vecchio"];
      return;
    }
    const row = await env.DB.prepare("SELECT ts, body FROM live WHERE k = ?").bind("dl:p:" + cc).first();
    let prev = {};
    try {
      prev = row && now - row.ts < 30 * 6e4 ? JSON.parse(row.body) : {};
    } catch (e) {
      prev = {};
    }
    let cur = {};
    if (d.merge) {
      cur = Object.assign({}, prev);
      for (const k in d.d) {
        if (d.d[k] == null) delete cur[k];
        else cur[k] = valOf(d.d[k], false);
      }
    } else {
      if (d.d && d.merge === false) d = d.d;
      for (const k in d) if (d[k] != null) cur[k] = valOf(d[k], GPS.has(cc));
    }
    const n = Object.keys(cur).length;
    const pn = Object.keys(prev).length;
    if (pn > 50 && n < pn / 2) {
      st[cc] = [now, n, 0, Date.now() - t0, "monco " + n + "/" + pn];
      return;
    }
    const hour = new Date(now).toISOString().replace(/[-T:]/g, "").slice(0, 10), sec = Math.floor(now / 1e3 % 3600);
    const { lines, next } = diff(prev, cur, sec);
    const ops = [env.DB.prepare("INSERT INTO live (k, ts, body) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts, body = excluded.body").bind("dl:p:" + cc, now, JSON.stringify(next))];
    if (lines.length) await (env.LOGDB || env.DB).prepare("INSERT INTO live (k, ts, body) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts, body = live.body || excluded.body").bind("dl:" + cc + ":" + hour, now, lines.join("\n") + "\n").run();
    await env.DB.batch(ops);
    st[cc] = [now, n, lines.length, Date.now() - t0, ""];
  } catch (e) {
    st[cc] = [now, 0, 0, Date.now() - t0, String(e.message || e).slice(0, 80)];
  }
}
async function runAll(env, ctx, conc = 5) {
  const srow = await env.DB.prepare("SELECT body FROM live WHERE k = 'dl:status'").first().catch(() => null);
  let st = {};
  try {
    st = srow ? JSON.parse(srow.body) : {};
  } catch (e) {
    st = {};
  }
  const list = [...new Set(GROUPS.flat())];
  let i = 0;
  await Promise.all(Array.from({ length: conc }, async () => {
    while (i < list.length) {
      const cc = list[i++];
      await one(cc, env, ctx, Date.now(), st);
    }
  }));
  await env.DB.prepare("INSERT INTO live (k, ts, body) VALUES ('dl:status', ?, ?) ON CONFLICT(k) DO UPDATE SET ts = excluded.ts, body = excluded.body").bind(Date.now(), JSON.stringify(st)).run();
  return st;
}
var EXT_FRESH_MS = 20 * 6e4;

// worker/dlio.js
var SEP = "";
var MAX_BODY = 12 * 1024 * 1024;
function pack(recs) {
  let s = "";
  for (const [t, k, ts, body] of recs) {
    const b = String(body == null ? "" : body);
    s += SEP + t + "	" + k + "	" + ts + "	" + b.length + "\n" + b;
  }
  return s;
}
function unpack(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== SEP) break;
    const nl = text.indexOf("\n", i);
    if (nl < 0) break;
    const h = text.slice(i + 1, nl).split("	");
    if (h.length !== 4) break;
    const n = +h[3];
    if (!(n >= 0) || nl + 1 + n > text.length) break;
    out.push([h[0], h[1], +h[2] || 0, text.slice(nl + 1, nl + 1 + n)]);
    i = nl + 1 + n;
  }
  return out;
}

// tools/dl_log.mjs
var SITE = process.env.SITE || "https://railpulse.ch";
var KEY = process.env.SOCIAL_CRON_KEY || "";
var DRY = !KEY || !!process.env.DRY;
function fakeDb(mem, appended) {
  const keyOf = (sql, a) => {
    const m = /\bk\s*=\s*'([^']+)'/.exec(sql) || /VALUES\s*\(\s*'([^']+)'/i.exec(sql);
    return m ? [m[1], a] : [a[0], a.slice(1)];
  };
  const stmt = (sql, a) => ({
    bind: (...b) => stmt(sql, b),
    async first() {
      const [k] = keyOf(sql, a);
      return mem.get(k) || null;
    },
    async all() {
      const m = /LIKE\s+'([^'%]+)%'/i.exec(sql);
      return { results: m ? [...mem].filter(([k]) => k.startsWith(m[1])).map(([k, v]) => ({ k, ts: v.ts, body: v.body })) : [] };
    },
    async run() {
      if (!/^\s*INSERT/i.test(sql)) return { meta: {} };
      const [k, rest] = keyOf(sql, a), ts = rest[0], body = rest[1];
      if (appended && /live\.body\s*\|\|\s*excluded\.body/.test(sql)) {
        const o = appended.get(k);
        appended.set(k, { ts, body: (o ? o.body : "") + body });
        return { meta: {} };
      }
      mem.set(k, { ts, body, dirty: true });
      return { meta: {} };
    }
  });
  return { prepare: (sql) => stmt(sql, []), async batch(ops) {
    for (const o of ops) await o.run();
    return [];
  } };
}
async function main() {
  const t0 = Date.now(), auth = KEY ? { Authorization: "Bearer " + KEY } : {};
  const mem = /* @__PURE__ */ new Map(), appended = /* @__PURE__ */ new Map();
  if (KEY) {
    const r = await fetch(SITE + "/api/social/dlio", { headers: { ...auth, "User-Agent": "railpulse-log" }, signal: AbortSignal.timeout(9e4) });
    if (!r.ok) throw new Error("lettura dello stato: HTTP " + r.status);
    const text = await r.text(), recs = unpack(text);
    if (!recs.length) throw new Error("stato vuoto o non leggibile (" + text.length + " caratteri)");
    for (const [, k, ts, body2] of recs) mem.set(k, { ts, body: body2 });
    console.log("stato letto:", recs.length, "voci,", Math.round(text.length / 1024), "kB,", Date.now() - t0, "ms");
  } else console.log("senza chiave: prova a secco, solo i feed pubblici");
  globalThis.caches = { default: { match: async () => void 0, put: async () => {
  } } };
  const env = { DB: fakeDb(mem, null), LOGDB: fakeDb(mem, appended), VIA_SITE: true }, ctx = { waitUntil() {
  } };
  const st = await runAll(env, ctx, 6);
  if (!DRY && Math.floor(Date.now() / 36e4) % 10 < 7 && st.at && !st.at[4]) {
    await new Promise((r) => setTimeout(r, Math.max(0, 47e3 - (Date.now() - st.at[0]))));
    await one("at", env, ctx, Date.now(), st);
    mem.set("dl:status", { ts: Date.now(), body: JSON.stringify(st), dirty: true });
    console.log("Austria: seconda lettura", JSON.stringify(st.at));
  }
  const now = Date.now(), out = [];
  for (const [k, v] of appended) out.push(["L", k, v.ts || now, v.body]);
  for (const [k, v] of mem) if (v.dirty && /^dl:(p:[a-z]{2}|status|v:fi)$/.test(k)) out.push(["P", k, v.ts || now, v.body]);
  let trains = 0, lines = 0;
  const bad = [];
  for (const cc in st) {
    const s = st[cc];
    if (now - s[0] > 10 * 6e4) continue;
    trains += s[1] || 0;
    lines += s[2] || 0;
    if (s[4]) bad.push(cc + ": " + s[4]);
  }
  console.log("giro fatto in", Date.now() - t0, "ms: treni", trains, "righe", lines, bad.length ? "| " + bad.join(" \xB7 ") : "");
  if (DRY) {
    console.log("non scritto (prova a secco):", out.length, "voci");
    return;
  }
  const body = pack(out);
  const w = await fetch(SITE + "/api/social/dlio", { method: "POST", body, headers: { ...auth, "Content-Type": "text/plain; charset=utf-8", "User-Agent": "railpulse-log" }, signal: AbortSignal.timeout(9e4) });
  const wt = await w.text();
  if (!w.ok) throw new Error("scrittura: HTTP " + w.status + " " + wt.slice(0, 200));
  console.log("scritto:", Math.round(body.length / 1024), "kB", wt);
}
if (process.argv[1] && /dl_log(\.bundle)?\.mjs$/.test(process.argv[1].replace(/\\/g, "/"))) main().catch((e) => {
  console.error("ERRORE", e && e.message ? e.message : e);
  process.exit(1);
});
export {
  fakeDb
};
