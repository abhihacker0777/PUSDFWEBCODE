/**
 * Pure client-side search over papersData.
 * STRICT REQUIREMENT: Does NOT use Gemini API key or any external API.
 */

export interface LocalPaperItem {
  id?: string | number;
  course?: string;
  year?: string;
  spec?: string;
  specialization?: string;
  sem?: string;
  semester?: string;
  exam?: string;
  name?: string;
  title?: string;
  subject?: string;
  drive_url?: string;
  link?: string;
  _score?: number;
  [key: string]: any;
}

const STOP_WORDS = new Set([
  "paper", "papers", "question", "questions", "pyqp", "pyqps",
  "pu", "poornima", "university", "for", "of", "in", "the", "a", "an", "and", "or", "to", "exam", "test",
  "mid", "term", "end", "examination", "give", "show", "find", "get", "search", "need", "please", "pls", "sir", "bhai", "with", "all"
]);

export const KNOWN_SPECS = [
  "cyber security", "artificial intelligence & data science", "artificial intelligence and data science",
  "artificial intelligence & machine learning", "artificial intelligence and machine learning",
  "cloud technology & devops", "cloud technology and devops", "cloud technology",
  "computer science and engineering", "computer science & engineering", "computer science",
  "electrical & computer engineering", "electrical and computer engineering",
  "mechanical engineering", "civil engineering", "data science", "full stack"
];

export interface LocalSearchOptions {
  relaxSemester?: boolean;
  relaxExam?: boolean;
}

const COURSE_MAP: Record<string, string> = {
  "btech": "B.Tech",
  "b tech": "B.Tech",
  "b.tech": "B.Tech",
  "mtech": "M.Tech",
  "m tech": "M.Tech",
  "m.tech": "M.Tech",
  "bca": "BCA",
  "mca": "MCA",
  "bba": "BBA",
  "mba": "MBA",
  "bcom": "B.Com",
  "b com": "B.Com",
  "b.com": "B.Com",
  "bsc": "B.Sc",
  "b sc": "B.Sc",
  "b.sc": "B.Sc",
  "ba": "BA",
  "b.a": "BA",
  "ma": "MA",
  "m.a": "MA",
  "bph": "BPH",
  "b.ph": "BPH",
  "bva": "BVA",
  "mva": "MVA",
  "mdes": "M.Des",
  "m des": "M.Des",
  "m.des": "M.Des",
  "bdes": "B.Des",
  "b des": "B.Des",
  "b.des": "B.Des",
  "barch": "B.Arch",
  "b arch": "B.Arch",
  "b.arch": "B.Arch",
  "mplan": "M.Plan",
  "m plan": "M.Plan",
  "m.plan": "M.Plan",
  "mha": "MHA",
  "mph": "MPH",
  "phd": "Ph.D",
  "ph.d": "Ph.D",
  "pihm": "PIHM"
};

const SUBJECT_SYNONYMS: Record<string, string[]> = {

  // Computer Science / IT
  "rdbms": ["relational database management system", "database management", "dbms"],
  "dbms": ["database management system", "database", "rdbms"],
  "os": ["operating system", "operating systems"],
  "cn": ["computer networks", "computer network", "networking"],
  "dsa": ["data structures", "data structure", "algorithms", "data structures & algorithms", "data structure and algorithm"],
  "daa": ["design and analysis of algorithms", "design & analysis of algorithms", "algorithm design"],
  "oops": ["object oriented programming", "object-oriented programming", "oop"],
  "oop": ["object oriented programming", "oops"],
  "ai": ["artificial intelligence"],
  "ml": ["machine learning"],
  "aiml": ["artificial intelligence and machine learning", "artificial intelligence & machine learning", "ai & ml"],
  "aids": ["artificial intelligence and data science", "artificial intelligence & data science", "ai & ds"],
  "ds": ["data science", "data science and analytics"],
  "ba": ["big data analytics", "big data analysis"],
  "bda": ["big data analytics", "big data analysis"],
  "dm": ["discrete mathematics", "data mining", "data mining and knowledge management"],
  "toc": ["theory of computation", "automata", "computational theory"],
  "coa": ["computer organization", "computer architecture", "computer organization and architecture"],
  "de": ["digital electronics", "digital electronic"],
  "ece": ["electronic devices and circuits", "electronic device and circuit"],
  "mp": ["microprocessor", "microprocessors", "microcontrollers", "microprocessor and microcontrollers"],
  "se": ["software engineering", "advanced software engineering"],
  "web": ["web technology", "web technologies", "web development"],
  "wt": ["web technology", "web technologies"],
  "php": ["php", "php with mysql", "php & mysql", "php framework"],
  "js": ["javascript", "java script"],
  "angular": ["angular js", "frontend with angular js", "javascript framework with angular js"],
  "react": ["react js", "frontend development with react js"],
  "node": ["node js", "backend development with node js", "backend with node js"],
  "uiux": ["ui ux", "ui/ux", "ui/ux design", "user interface", "user experience"],
  "iot": ["internet of things"],
  "iiot": ["industrial internet of things"],
  "nsp": ["natural language processing", "nlp"],
  "nlp": ["natural language processing"],
  "cv": ["computer vision"],
  "dl": ["deep learning"],
  "ann": ["artificial neural network", "neural network"],
  "dip": ["digital image processing"],
  "cs": ["computer science", "cyber security"],
  "cyber": ["cyber security", "cybersecurity", "information security", "network security"],
  "security": ["cyber security", "information security", "cryptography", "network security"],
  "is": ["information system", "information systems"],
  "iss": ["information system security", "information systems security"],
  "vapt": ["vulnerability assessment and penetration testing", "vulnerability analysis and penetration testing"],
  "eh": ["ethical hacking"],
  "cf": ["cyber forensics", "cyber forensic"],
  "cti": ["cyber threat intelligence"],
  "ipr": ["intellectual property rights"],
  "soc": ["security operations", "security operations center", "sociology", "basic concepts of sociology", "introduction to sociology"],
  "linux": ["linux programming", "linux and shell programming", "linux shell programming"],
  "shell": ["shell script", "shell scripting", "shell and linux programming"],
  "phpmysql": ["php with mysql", "php & mysql"],
  "java": ["java programming", "advanced java", "advanced java programming", "core java"],
  "c": ["c programming", "programming in c", "programming fundamentals of c"],
  "cpp": ["c++", "object oriented programming with c++"],
  "python": ["programming in python", "python programming", "fundamentals of python"],
  "r": ["r programming"],
  "sas": ["sas software", "sas viya", "deep learning using sas software", "structural analysis", "structural analysis ii"],

  // Cloud / DevOps
  "cloud": ["cloud technology", "cloud computing", "fundamentals of cloud computing", "cloud web services"],
  "devops": ["devops", "devops lifecycle and best practices"],
  "k8s": ["kubernetes", "containerization and orchestration with kubernetes"],

  // Mathematics / Science
  "math": ["mathematics", "engineering mathematics", "discrete mathematics", "basic of mathematics", "foundation of mathematics"],
  "maths": ["mathematics", "engineering mathematics", "discrete mathematics"],
  "physics": ["engineering physics", "physics"],
  "chem": ["chemistry", "engineering chemistry", "inorganic chemistry", "organic chemistry", "physical chemistry"],
  "stats": ["statistics", "statistics and probability", "statistical foundation of data science"],
  "prob": ["probability", "probability and statistics", "statistics and probability theory"],
  "num": ["numerical analysis", "numerical methods"],
  "calculus": ["vector calculus and matrices", "calculus"],
  "algebra": ["abstract algebra"],
  "qm": ["quantum mechanics"],
  "spectroscopy": ["atomic and molecular spectroscopy"],

  // Engineering
  "mech": ["mechanical engineering", "basic of mechanical engineering"],
  "civil": ["civil engineering", "basic of civil engineering", "basics of civil engineering"],
  "eee": ["electrical and electronics engineering", "basics of electrical and electronics engineering"],
  "ee": ["electrical engineering", "electrical machines", "electrical circuit and analysis"],
  "em": ["electrical machines", "estimation and costing", "estimating and costing", "entrepreneurial and managerial skills"],
  "eca": ["electrical circuit and analysis"],
  "ec": ["electrical circuit", "electrical circuits"],
  "me": ["mechanical engineering", "engineering mechanics"],
  "emec": ["engineering mechanics"],
  "thermo": ["engineering thermodynamics", "thermodynamics"],
  "fm": ["fluid mechanics", "fluid mechanics and fluid machines"],
  "hmt": ["heat and mass transfer"],
  "automobile": ["automobile and ic engine"],
  "ic": ["internal combustion", "automobile and ic engine"],
  "mt": ["mechatronics"],
  "manufacturing": ["manufacturing processes", "manufacturing science and technology"],
  "cip": ["computer integrated manufacturing"],
  "ev": ["electric vehicle technology"],
  "eeep": ["electrical power generation transmission and distribution"],
  "pe": ["power electronics and drives"],
  "ps": ["power system", "power system analysis"],
  "psoc": ["power system operation and control"],
  "sg": ["smart grid", "power system restructuring and smart grid"],

  // Civil / Construction
  "bmc": ["building material and construction", "building materials and construction"],
  "ct": ["concrete and construction technology"],
  "ce": ["construction engineering", "construction equipment"],
  "ecost": ["estimation and costing", "estimating and costing"],
  "ge": ["geotechnical engineering"],
  "gt": ["ground improvement techniques"],
  "te": ["transportation engineering"],
  "tp": ["transportation planning"],
  "tis": ["transportation intelligent systems", "intelligent transportation systems"],
  "its": ["intelligent transportation systems"],
  "hydro": ["hydrology and ground water"],
  "sa": ["structural analysis", "structural analysis i", "structural analysis ii"],
  "som": ["strength of material", "strength of materials"],
  "dos": ["design of steel structures"],
  "dcs": ["design of concrete structures"],
  "dme": ["design of machine elements", "design of machine element"],
  "rac": ["refrigeration and air conditioning"],
  "et": ["earthquake resistant design of structures"],
  "fem": ["finite element methods"],
  "ram": ["repair and rehabilitation of structures"],
  "hcad": ["highway construction practice", "highway traffic analysis and design"],
  "pm": ["project management"],
  "cpm": ["construction planning and management"],

  // Environment
  "evs": ["environmental studies", "environmental science"],
  "env": ["environmental engineering", "environment and sustainability", "environment sustainability"],
  "eia": ["environmental impact assessment"],
  "eec": ["environmental engineering and management"],
  "epc": ["environmental pollution and control"],
  "es": ["environment and sustainability", "environment sustainability"],
  "eem": ["environmental engineering and management"],
  "eqm": ["environmental quality monitoring"],
  "gis": ["geographic information system", "geospatial information system", "remote sensing and gis"],
  "rs": ["remote sensing", "remote sensing and gis"],

  // Management / Commerce
  "comm": ["professional communication", "technical communication", "english"],
  "acc": ["financial accounting", "accounting", "accountancy"],
  "ca": ["cost accounting", "corporate accounting"],
  "ma": ["management accounting"],
  "fa": ["financial accounting", "financial audit"],
  "eco": ["economics", "managerial economics", "engineering economics"],
  "be": ["business economics", "business economics i"],
  "bi": ["business intelligence"],
  "mis": ["management information system", "management information systems"],
  "hr": ["human resource management", "organizational behaviour and human resource"],
  "ob": ["organizational behaviour", "group behavior"],
  "scm": ["supply chain and logistics management"],
  "marketing": ["fundamentals of marketing", "digital marketing"],
  "dbm": ["development finance", "database management system"],
  "ethics": ["business ethics", "professional practice and ethics"],

  // Design / Architecture / Fashion
  "arch": ["architecture", "history of architecture"],
  "bim": ["building information modeling"],
  "vaastu": ["basics of vaastu"],
  "fashion": ["fashion study", "fashion advertising and marketing", "fashion trend and forecasting"],
  "textile": ["indian traditional textile"],
  "portfolio": ["portfolio presentation"],
  "avd": ["advance visual design"],
  "art": ["art design and fashion", "fundamentals of visual art"],
  "design": ["design thinking", "product design and development"],

  // Health / Public Health
  "ph": ["public health"],
  "phe": ["public health ethics and law"],
  "phi": ["public health informatics"],
  "phn": ["public health nutrition"],
  "he": ["health education", "health economics"],
  "hpc": ["health education promotion and communication"],
  "hm": ["health management", "health management principles and practices"],
  "hmis": ["hospital management information system"],
  "rmncha": ["reproductive maternal health child health and adolescent"],
  "epi": ["epidemiology", "basic epidemiology"],
  "biostat": ["biostatistics", "basic biostatistics"],
  "gh": ["global health", "global health scenario"],
  "dh": ["digital health"],
  "mh": ["mental health", "psychology and mental health"],

  // Humanities / Social Science
  "psych": ["psychology", "introduction to psychology", "development psychology"],
  "geo": ["geography", "human geography", "physical geography"],
  "hist": ["history", "history of india", "history of modern india", "ancient indian history"],
  "pol": ["political science", "selected political system", "selected constitutions"],
  "ie": ["international economics"],
  "il": ["international law"],
  "eng": ["english", "prose and fiction", "drama", "english literature"],

  // Other
  "dmgt": ["disaster management"],
  "rm": ["research methodology", "research methods"],
  "rmstat": ["research methods and statistics"],
  "qa": ["quality assurance", "quality assurance for games"],
  "qc": ["quality control", "statistical quality control"],
  "sixsigma": ["six sigma"],
  "erp": ["enterprise resource planning"],
  "blockchain": ["block chain", "blockchain technology"],
  "arvr": ["augmented reality and virtual reality", "ar and vr"],
  "vr": ["virtual reality"],
  "ar": ["augmented reality"],
  "game": ["game technology", "game design", "game development"],
  "mobile": ["mobile application development"],
  "android": ["android application development"],
  "swach": ["swach bharat"]
};

function normalize(str: any): string {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normYear(year: any): string {
  return normalize(year);
}

export function searchLocalPapers(
  papers: LocalPaperItem[],
  rawQuery: string,
  options?: LocalSearchOptions
): LocalPaperItem[] {
  const query = String(rawQuery || "").trim();
  if (!query) return [];

  const normQuery = normalize(query);
  if (!normQuery) return [];

  // Extract explicit semester e.g. "1 sem", "1sem", "sem 1", "1st sem"
  let parsedSem: string | null = null;
  const semMatch = normQuery.match(/\b(10|[1-9])\s*(?:st|nd|rd|th)?\s*(?:sem|semester)\b/) ||
    normQuery.match(/\b(?:sem|semester)\s*(10|[1-9])\b/);
  if (semMatch) {
    parsedSem = `${Number(semMatch[1])} Sem`;
  }

  // Extract explicit exam e.g. "mid term", "mse", "ese", "end term"
  let parsedExam: string | null = null;
  if (/\b(mid|midterm|mid\s*term|mid\s*sem|mse|mte)\b/.test(normQuery)) {
    parsedExam = "MSE";
  } else if (/\b(end|endterm|end\s*term|end\s*sem|final|ese|ete)\b/.test(normQuery)) {
    parsedExam = "ESE";
  }

  // Extract explicit course e.g. "b tech", "btech", "bca"
  let parsedCourse: string | null = null;
  for (const [alias, canonical] of Object.entries(COURSE_MAP)) {
    const regex = new RegExp(`\\b${alias.replace(/\./g, "\\.")}\\b`, "i");
    if (regex.test(normQuery)) {
      parsedCourse = canonical;
      break;
    }
  }

  // Extract detected specialization
  let detectedSpec: string | null = null;
  for (const spec of KNOWN_SPECS) {
    if (normQuery.includes(spec)) {
      detectedSpec = spec;
      break;
    }
  }

  // Extract tokens excluding stopwords and parsed course/sem/exam
  const rawTokens = normQuery.split(" ").filter(Boolean);
  const searchTokens: string[] = [];
  const subjectTokens: string[] = [];

  for (const token of rawTokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token === "sem" || token === "semester") continue;
    if (parsedSem && token === parsedSem.split(" ")[0]) continue;
    if (token === "mse" || token === "ese" || token === "mte" || token === "ete") continue;
    if (parsedCourse && normalize(parsedCourse).split(" ").includes(token)) continue;
    searchTokens.push(token);

    if (!detectedSpec || !detectedSpec.split(" ").includes(token)) {
      subjectTokens.push(token);
    }
  }

  const scoredPapers: LocalPaperItem[] = [];

  for (const paper of papers || []) {
    const pCourse = String(paper.course || "");
    const pYear = String(paper.year || "");
    const pSpec = String(paper.spec || paper.specialization || "");
    const pSem = String(paper.sem || paper.semester || "");
    const pExam = String(paper.exam || "");
    const pName = String(paper.name || paper.title || paper.subject || "");

    const normName = normalize(pName);
    const normSpec = normalize(pSpec);
    const normCourse = normalize(pCourse);
    const normSem = normalize(pSem);
    const normExam = normalize(pExam);

    const fullPaperText = `${normCourse} ${normSpec} ${normYear(pYear)} ${normSem} ${normExam} ${normName}`;

    // Filter constraint: Course
    if (parsedCourse) {
      if (normCourse !== normalize(parsedCourse)) {
        continue;
      }
    }

    // Filter constraint: Specialization if detected
    if (detectedSpec && !normSpec.includes(detectedSpec)) {
      const specWords = detectedSpec.split(" ");
      const matchesSpec = specWords.some((w) => normSpec.includes(w));
      if (!matchesSpec) continue;
    }

    // Filter constraint: Semester
    if (!options?.relaxSemester && parsedSem) {
      if (normSem !== normalize(parsedSem)) {
        continue;
      }
    }

    // Filter constraint: Exam
    if (!options?.relaxExam && parsedExam) {
      if (normExam !== normalize(parsedExam)) {
        continue;
      }
    }

    let score = 0;
    let nameMatchedCount = 0;
    let totalTokensMatched = 0;

    // Check query tokens against the paper text and name
    for (const token of searchTokens) {
      const isNameMatch = normName.includes(token);
      const isSpecMatch = normSpec.includes(token);
      const isFullMatch = fullPaperText.includes(token);

      // Check synonym matches
      const syns = SUBJECT_SYNONYMS[token] || [];
      const synNameMatch = syns.some((syn) => normName.includes(normalize(syn)));
      const synSpecMatch = syns.some((syn) => normSpec.includes(normalize(syn)));

      if (isNameMatch) {
        score += 40;
        nameMatchedCount++;
        totalTokensMatched++;
      } else if (synNameMatch) {
        score += 35;
        nameMatchedCount++;
        totalTokensMatched++;
      } else if (isSpecMatch || synSpecMatch) {
        score += 15;
        totalTokensMatched++;
      } else if (isFullMatch) {
        score += 5;
        totalTokensMatched++;
      }
    }

    // CRITICAL: If subject tokens were present in the query, the paper MUST match at least one subject token in its name/title
    if (subjectTokens.length > 0 && nameMatchedCount === 0) {
      continue;
    }

    // If query had search tokens but NONE matched anywhere, skip
    if (searchTokens.length > 0 && totalTokensMatched === 0) {
      continue;
    }

    // Exact phrase bonus in subject name
    if (subjectTokens.length > 0 && normName.includes(subjectTokens.join(" "))) {
      score += 70;
    }

    // Base match score if filtered by course/sem/exam
    if (parsedCourse) score += 20;
    if (parsedSem && normSem === normalize(parsedSem)) score += 25;
    if (parsedExam && normExam === normalize(parsedExam)) score += 15;

    scoredPapers.push({
      ...paper,
      _score: score
    });
  }

  // Sort by score descending, then alphabetically by paper name
  scoredPapers.sort((a, b) => {
    if ((b._score || 0) !== (a._score || 0)) return (b._score || 0) - (a._score || 0);
    const nameA = (a.name || a.title || "").toLowerCase();
    const nameB = (b.name || b.title || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return scoredPapers;
}
