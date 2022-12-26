import './DetailBar.css';

export const variables = {
    height: 20,
};

export default function DetailBar() {
    const styles = {
        container: {
            height: variables.height,
        },
    };

    return (
        <div className="detail-bar-container" style={styles.container}>
        </div>
    );
}
