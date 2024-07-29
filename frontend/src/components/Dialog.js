import React from 'react';
import './Dialog.css';

const SimpleModal = ({ modalTitle, modalContent, isOpen, onClose, onSave }) => {
  // const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      {/* <button onClick={()=>setIsModalOpen(true)}>EDIT</button> */}
      {isOpen && (
        <div className="modal">
          <div className="modal-content light">
            <span className="close-button" onClick={onClose}>&times;</span>
            <h2 className='light'>{modalTitle}</h2>
            {modalContent}
            <div className="modal-footer">
              <button className="modal-button" onClick={onClose}>Cancel</button>
              <button className="modal-button" onClick={onSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleModal;
