import LeftPanel from './LeftPanel/LeftPanel';
import MainPanel from './MainPanel/MainPanel';
import './App.css';

export default function App() {
    const styles = {
        container: {
            backgroundColor: '#00000077',
        },
    };

    return (
        <div className="app-background">
            <div className="app-container" style={styles.container}>
                <LeftPanel />
                <MainPanel />
            </div>
        </div>
    );
}
