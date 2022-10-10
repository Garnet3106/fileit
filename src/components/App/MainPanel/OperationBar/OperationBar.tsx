import { preferences } from '../../../../preferences';
import './OperationBar.css';

export const variables = {
    height: 70,
};

export default function OperationBar() {
    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            height: `${variables.height}px`,
        },
    };

    return (
        <div className="operation-bar-container" style={styles.container}>
        </div>
    );
}
