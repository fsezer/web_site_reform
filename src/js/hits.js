import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./allowlist.js";

/** Admin: eski Firestore hit kayıtlarını tarih aralığında oku. */
export async function fetchHitsBetween(fromYmd, toYmd) {
  const snap = await getDocs(
    query(collection(db, "hits"), where("date", ">=", fromYmd), where("date", "<=", toYmd)),
  );
  return snap.docs.map((item) => item.data());
}
