import React, { useRef, useState } from 'react';
import { Button, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// `uploadFn` es lo único que antes ataba este componente a esta app: subía
// siempre a uploadCV (el endpoint de CV de candidatos), así que no se podía
// reutilizar para ningún otro tipo de fichero ni en ningún otro proyecto.
// Ahora es genérico -- solo depende de react-bootstrap y de recibir una
// función `(file) => Promise<T>` por prop; quien lo use decide a qué
// endpoint sube el fichero y qué forma tiene la respuesta.
const FileUploader = ({ onChange, onUpload, uploadFn }) => {
  const { t } = useTranslation();
  // El <input type="file"> nativo pinta su propio botón y su propio texto
  // de "ningún archivo seleccionado" en el idioma del sistema operativo/
  // navegador, no en el de la página — no hay forma de traducirlo desde
  // React/CSS. Se oculta visualmente (sin quitarlo del DOM ni del orden de
  // tabulación, para que siga siendo accesible por teclado) y se controla
  // por completo con un botón propio, con su propio texto ya traducido.
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setFileName(event.target.files[0].name);
    onChange(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (file) {
      setLoading(true);
      setError('');
      try {
        const data = await uploadFn(file);
        setFileData(data);
        onUpload(data);
      } catch (error) {
        console.error(error);
        setError(error.isNetworkError ? t('common.networkError') : error.message);
      } finally {
        setLoading(false); // Asegura que loading se establezca a false después de la operación
      }
    }
  };

  return (
    <div>
      <InputGroup className="mb-3">
        <FormControl
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          aria-label={t('fileUploader.ariaLabel')}
          aria-describedby="basic-addon2"
          className="visually-hidden"
        />
        <Button variant="outline-secondary" onClick={() => inputRef.current?.click()}>
          {t('fileUploader.browse')}
        </Button>
        <Button variant="outline-secondary" onClick={handleFileUpload}>
          {loading ? (
            <Spinner animation="border" role="status" size="sm" />
          ) : (
            t('fileUploader.upload')
          )}
        </Button>
      </InputGroup>
      <p className="mb-0">
        {fileName ? `${t('fileUploader.selectedFile')} ${fileName}` : t('fileUploader.noFileSelected')}
      </p>
      {fileData && (
        <p className="mt-2">
          {t('fileUploader.success')}
        </p>
      )}
      {error && <p className="mt-2 text-danger">{error}</p>}
    </div>
  );
};

export default FileUploader;
