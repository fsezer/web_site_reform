import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./allowlist.js";

const SEO_COL = "seoPages";
const NOTES_COL = "notes";
const LOCAL_SEO = "sanas-admin-seo";
const LOCAL_NOTES = "sanas-admin-notes-v2";

function asList(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listSeoPages() {
  const snap = await getDocs(query(collection(db, SEO_COL), orderBy("updated", "desc")));
  return asList(snap);
}

export async function getSeoBySlug(slug) {
  const clean = String(slug || "")
    .replace(/\.html$/i, "")
    .trim();
  if (!clean) return null;
  try {
    const snap = await getDoc(doc(db, SEO_COL, clean));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() };
    if (data.status !== "published") return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveSeoPage(item, previousSlug = "") {
  const slug = String(item.slug || "").trim();
  if (!slug) throw new Error("Slug gerekli");
  const payload = {
    ...item,
    id: slug,
    slug,
    status: item.status === "published" ? "published" : "draft",
    updated: Date.now(),
    created: item.created || Date.now(),
  };
  await setDoc(doc(db, SEO_COL, slug), payload, { merge: true });
  const prev = String(previousSlug || "").trim();
  if (prev && prev !== slug) {
    try {
      await deleteDoc(doc(db, SEO_COL, prev));
    } catch {
      /* ignore */
    }
  }
  return payload;
}

export async function deleteSeoPage(id) {
  await deleteDoc(doc(db, SEO_COL, id));
}

export async function publishSeoPage(id) {
  const ref = doc(db, SEO_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Sayfa yok");
  const data = snap.data();
  const payload = {
    ...data,
    id,
    slug: data.slug || id,
    status: "published",
    publishedAt: Date.now(),
    updated: Date.now(),
  };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function unpublishSeoPage(id) {
  const ref = doc(db, SEO_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Sayfa yok");
  const payload = { ...snap.data(), id, status: "draft", updated: Date.now() };
  await setDoc(ref, payload, { merge: true });
  return payload;
}

export async function listNotes() {
  const snap = await getDocs(query(collection(db, NOTES_COL), orderBy("updated", "desc")));
  return asList(snap);
}

export async function saveNote(item) {
  const id = item.id || crypto.randomUUID();
  const payload = {
    id,
    title: String(item.title || "").trim(),
    body: String(item.body || "").trim(),
    updated: Date.now(),
    created: item.created || Date.now(),
  };
  await setDoc(doc(db, NOTES_COL, id), payload, { merge: true });
  return payload;
}

export async function deleteNote(id) {
  await deleteDoc(doc(db, NOTES_COL, id));
}

/** One-time localStorage → Firestore migrate (same browser). */
export async function migrateLocalCmsIfNeeded() {
  const flag = "sanas-cms-migrated-v1";
  if (localStorage.getItem(flag)) return { seo: 0, notes: 0 };

  let seoCount = 0;
  let notesCount = 0;
  try {
    const seoRaw = JSON.parse(localStorage.getItem(LOCAL_SEO) || "null");
    if (Array.isArray(seoRaw) && seoRaw.length) {
      for (const item of seoRaw) {
        const slug = String(item.slug || item.id || "").trim();
        if (!slug) continue;
        await saveSeoPage({
          ...item,
          slug,
          status: item.status || "draft",
        });
        seoCount += 1;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const notesRaw = JSON.parse(localStorage.getItem(LOCAL_NOTES) || "null");
    if (Array.isArray(notesRaw) && notesRaw.length) {
      for (const item of notesRaw) {
        await saveNote(item);
        notesCount += 1;
      }
    }
  } catch {
    /* ignore */
  }

  localStorage.setItem(flag, "1");
  if (seoCount || notesCount) {
    localStorage.removeItem(LOCAL_SEO);
    localStorage.removeItem(LOCAL_NOTES);
  }
  return { seo: seoCount, notes: notesCount };
}

export async function listPublishedSeoForSitemap() {
  const snap = await getDocs(query(collection(db, SEO_COL), where("status", "==", "published")));
  return asList(snap);
}
