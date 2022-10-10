import { preferences } from '../../../../preferences';
import './DetailBar.css';

export const variables = {
    height: 20,
};

export default function DetailBar() {
    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            height: variables.height,
        },
    };

    return (
        <div className="detail-bar-container" style={styles.container}>
        </div>
    );
}
