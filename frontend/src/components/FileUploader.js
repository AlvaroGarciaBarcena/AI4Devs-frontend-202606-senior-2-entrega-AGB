import React, { useState } from 'react';
import { Button, InputGroup, FormControl, Spinner } from 'react-bootstrap';
import { uploadCV } from '../services/candidateService';

const FileUploader = ({ onChange, onUpload }) => {
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
        const data = await uploadCV(file);
        setFileData(data);
        onUpload(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false); // Asegura que loading se establezca a false después de la operación
      }
    }
  };

  return (
    <div>
      <InputGroup className="mb-3">
        <FormControl
          type="file"
          onChange={handleFileChange}
          aria-label="File"
          aria-describedby="basic-addon2"
        />
        <Button variant="outline-secondary" onClick={handleFileUpload}>
          {loading ? (
            <Spinner animation="border" role="status" size="sm" />
          ) : (
            'Subir Archivo'
          )}
        </Button>
      </InputGroup>
      <p className="mb-0">Selected file: {fileName}</p>
      {fileData && (
        <p className="mt-2">
          Archivo subido con éxito
        </p>
      )}
      {error && <p className="mt-2 text-danger">{error}</p>}
    </div>
  );
};

export default FileUploader;
