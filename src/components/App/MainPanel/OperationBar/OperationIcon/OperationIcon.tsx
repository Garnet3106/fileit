import { MouseEvent } from 'react';
import { preferences } from '../../../../../common/preferences';
import './OperationIcon.css';

export type OperationIconProps = {
    id: string,
    mini?: boolean,
    preventClick?: boolean,
    onClick?: (event: MouseEvent) => void,
};

export default function OperationIcon(props: OperationIconProps) {
    const miniClassName = props.mini === true ? 'operation-icon-container-mini' : '';

    const styles = {
        container: {
            backgroundImage: `url('./lib/img/icons/${preferences.appearance.theme}/operations/${props.id}.svg')`,
            opacity: props.preventClick === true ? 0.5 : 1,
        },
    };

    return (
        <div
            className={`operation-icon-container ${miniClassName}`}
            style={styles.container}
            onClick={props.onClick}
        />
    );
}
