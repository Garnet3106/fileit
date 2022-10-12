import { preferences } from '../../../../../preferences';
import './OperationIcon.css';

export type OperationIconProps = {
    id: string,
    isMini?: boolean,
};

export default function OperationIcon(props: OperationIconProps) {
    const isMini = props.isMini === true;
    const miniClassName = isMini ? 'operation-icon-container-mini' : '';

    const styles = {
        container: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/operations/${props.id}.svg')`,
        },
    };

    return (
        <div className={`operation-icon-container ${miniClassName}`} style={styles.container} />
    );
}
