import { Spinner } from "react-bootstrap";

export default function LoadingSpinner() {
    return (
        <div className="d-flex justify-content-center align-items-center" 
             style={{
                 position: 'fixed',
                 top: 0,
                 left: 0,
                 right: 0,
                 bottom: 0,
                 backgroundColor: 'rgba(0,0,0,0.1)',
                 zIndex: 9999
             }}>
            <Spinner animation="border" variant="danger" />
        </div>
    );
}