import { useId, useState } from "react";
import styles from "./project-documents.module.css";

import { MAX_PROJECT_FILES, MAX_PROJECT_FILE_SIZE_BYTES, PROJECT_FILE_ACCEPT, projectFilesError } from "../submission/file-policy";
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export function ProjectDocuments({ files, onChange }: { files: readonly File[]; onChange: (files: File[]) => void }) {
  const id = useId();
  const [error, setError] = useState("");
  function add(incoming: readonly File[]) {
    const next = [...files];
    const rejected: string[] = [];
    for (const file of incoming) {
      if (next.some((item) => sameFile(item, file))) continue;
      const reason = projectFilesError([...next, file]);
      if (reason) rejected.push(reason.startsWith(`${file.name}:`) ? reason : `${file.name}: ${reason}`);
      else next.push(file);
    }
    onChange(next);
    setError(rejected.join(" "));
  }
  return <div className={styles.documents}>
    <label htmlFor={id} className={styles.dropzone} onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); add(Array.from(event.dataTransfer.files)); }}>
      <span>Adjuntar planos y documentos</span>
      <span className={styles.help}>Arrástralos aquí o selecciona archivos</span>
      <input id={id} type="file" multiple accept={PROJECT_FILE_ACCEPT}
        aria-describedby={`${id}-help`} onChange={(event) => { add(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    </label>
    <p id={`${id}-help`} className={styles.help}>PDF, XLSX, PNG o JPG/JPEG. Máximo {MAX_PROJECT_FILES} archivos, {MAX_PROJECT_FILE_SIZE_BYTES / 1024 / 1024} MB por archivo.</p>
    {error && <p role="alert" className={styles.help}>{error}</p>}
    <ul className={styles.list} aria-label="Archivos seleccionados">
      {files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}`}>
        <span>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span>
        <button type="button" aria-label={`Quitar ${file.name}`} onClick={() => { onChange(files.filter((_, i) => i !== index)); setError(""); }}>Quitar</button>
      </li>)}
    </ul>
    <p role="status" className={styles.help}>{files.length ? `${files.length} archivo(s) seleccionado(s). ` : ""}Los documentos aún no se han enviado.</p>
  </div>;
}
