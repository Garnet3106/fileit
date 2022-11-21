import LeftPanel from './LeftPanel/LeftPanel';
import MainPanel from './MainPanel/MainPanel';
import './App.css';
import PopupList from './PopupList/PopupList';

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
                <PopupList />
            </div>
        </div>
    );
}
