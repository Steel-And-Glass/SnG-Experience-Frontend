import { useId, useState } from "react";
import { IDEA_PHOTO_ACCEPT, ideaPhotoError } from "../submission/idea-photo-policy";
import styles from "./project-documents.module.css";

export function IdeaPhotoUpload({ photo, onChange }: { photo: File | null; onChange: (photo: File | null) => void }) {
  const id = useId();
  const [error, setError] = useState("");
  function select(files: FileList | null) {
    if (!files?.length) return;
    if (files.length > 1) { setError("Selecciona una sola fotografía."); return; }
    const next = files[0];
    const message = ideaPhotoError(next);
    if (message) { setError(message); return; }
    onChange(next);
    setError("");
  }
  return <section className={`${styles.documents} ${styles.ideaPhoto}`} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>Permítenos ver tu idea</h3>
    <p id={`${id}-description`} className={styles.help}>Si tienes una fotografía o referencia visual que nos ayude a entender lo que imaginas para tu proyecto, compártela con nosotros.</p>
    <label htmlFor={id} className={styles.dropzone}>
      <span>Añadir fotografía</span>
      <input id={id} type="file" accept={IDEA_PHOTO_ACCEPT} aria-describedby={`${id}-description ${id}-help${error ? ` ${id}-error` : ""}`} aria-invalid={Boolean(error)}
        onChange={(event) => { select(event.target.files); event.target.value = ""; }} />
    </label>
    <p id={`${id}-help`} className={styles.help}>JPG o PNG · 1 imagen · opcional · máximo 20 MB</p>
    {error && <p id={`${id}-error`} role="alert" className={styles.help}>{error}</p>}
    {photo && <ul className={styles.list} aria-label="Fotografía seleccionada"><li>
      <span>{photo.name}<small>{(photo.size / 1024 / 1024).toFixed(1)} MB</small></span>
      <button type="button" aria-label={`Quitar fotografía ${photo.name}`} onClick={() => { onChange(null); setError(""); }}>Quitar</button>
    </li></ul>}
  </section>;
}
