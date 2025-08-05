import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const MessageModal = ({ message, type = 'info', onClose }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      default:
        return '#007bff';
    }
  };

  return (
    <>
      <div className="message-modal-overlay" onClick={onClose}>
        <div className="message-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="message-modal-header">
            <h2 className="message-modal-title" style={{ color: getTypeColor() }}>
              {type.toUpperCase()}
            </h2>
            <button className="message-modal-close-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </button>
          </div>
          <div className="message-modal-body">
            <p className="message-modal-text">
              {message}
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          .message-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .message-modal-box {
            background-color: #282850;
            border-radius: 6px;
            padding: 20px;
            width: 600px;
            color: #ccc;
            max-width: 90%;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            animation: fadeIn 0.3s ease-in-out;
          }

          .message-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .message-modal-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }

          .message-modal-close-btn {
            background: none;
            border: none;
            font-size: 20px;
            color: #666;
            cursor: pointer;
            transition: color 0.2s;
          }

          .message-modal-body {
            padding-top: 10px;
          }

          .message-modal-text {
            font-size: 1.1rem;
            color: #ccc;
            margin: 0;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </>
  );
};

export default MessageModal;
