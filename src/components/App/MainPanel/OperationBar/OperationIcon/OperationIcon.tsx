import { preferences } from '../../../../../preferences';
import './OperationIcon.css';

export type OperationIconProps = {
    id: string,
};

export default function OperationIcon(props: OperationIconProps) {
    const styles = {
        container: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/operations/${props.id}.svg')`,
        },
    };

    return (
        <div className="operation-icon-container" style={styles.container} />
    );
}
