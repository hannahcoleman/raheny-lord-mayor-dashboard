/**
 * Best-effort first-name -> gender lookup, used only to suggest a gender for
 * Juvenile results (the source data never records one). This is advisory
 * only - see buildDataset.ts: suggestions go to juvenile-gender-suggestions.json
 * for a human to review, never straight into the authoritative
 * juvenile-genders.json. Common Irish/British first names, since that's the
 * club's population; anything not confidently recognised returns null rather
 * than guessing.
 */

const MALE_NAMES = new Set(
  [
    "aaron", "adam", "aidan", "aiden", "alan", "andrew", "anthony", "ben", "benjamin", "bob",
    "brian", "cian", "cillian", "colm", "conor", "conn", "daniel", "darragh", "david", "dean",
    "declan", "dillon", "dylan", "eoin", "evan", "fionn", "gavin", "harry", "hugh", "ian",
    "jack", "james", "jamie", "jason", "jayden", "jimmy", "joe", "joey", "john", "johnnie",
    "johnny", "jonathan", "jordan", "josh", "joshua", "keith", "kevin", "kian", "killian",
    "leo", "liam", "louis", "luke", "marcus", "mark", "martin", "matthew", "michael", "niall",
    "noah", "oisin", "oliver", "oscar", "patrick", "paul", "peter", "philip", "rian", "robert",
    "rory", "ross", "rowan", "ruairi", "ruadan", "ryan", "sean", "seamus", "seán", "shane",
    "simon", "stephen", "thomas", "tim", "timmy", "tom", "tommy", "william", "donnacha",
    "donnachadh", "donnchadh",
  ].map((n) => n.toLowerCase())
);

const FEMALE_NAMES = new Set(
  [
    "abbie", "abbey", "abby", "aine", "aisling", "alice", "amelia", "amy", "anna", "annabel",
    "aoibhinn", "aoife", "ava", "bernie", "cara", "caoimhe", "chloe", "clare", "ciara", "eabha",
    "eilis", "elaine", "ella", "ellen", "emily", "emma", "erin", "evie", "faye", "fiona", "grace",
    "hannah", "holly", "isla", "jade", "jennifer", "julia", "kate", "katie", "laura", "leah",
    "lily", "lilly", "lucy", "maeve", "maggie", "mary", "mia", "molly", "mya", "neassa", "niamh",
    "nicole", "noreen", "orla", "orlaith", "paula", "robyn", "roisin", "ruth", "saoirse", "sarah",
    "sinead", "siobhan", "sophia", "sophie", "steff", "suzanne", "yulia", "zoe", "afric",
  ].map((n) => n.toLowerCase())
);

export function inferGenderFromName(fullName: string): "Men" | "Women" | null {
  const firstName = fullName.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  if (!firstName) return null;
  if (MALE_NAMES.has(firstName)) return "Men";
  if (FEMALE_NAMES.has(firstName)) return "Women";
  return null;
}
