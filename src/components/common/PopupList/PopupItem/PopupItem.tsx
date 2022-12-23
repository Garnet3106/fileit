import { useEffect } from 'react';
import { Popup } from '../../../../common/popup';
import { generateUuid } from '../../../../common/utils';
import './PopupItem.css';
import PopupOperationButton, { PopupOperationButtonData } from './PopupOperationButton/PopupOperationButton';

export type PopupItemData = {
    title: string,
    description: string,
    progress?: number,
    timeout?: number,
    buttons?: PopupOperationButtonData[],
};

export type PopupItemProps = {
    uuid: string,
    data: PopupItemData,
};

export default function PopupItem(props: PopupItemProps) {
    const progressPercent = `${props.data.progress ?? 0}%`;

    const styles = {
        progressBar: {
            marginBottom: props.data.buttons === undefined || props.data.buttons.length === 0 ? undefined : '10px',
        },
        progressBarFilling: {
            width: progressPercent,
        },
    };

    const renderers = {
        buttons: () => (
            props.data.buttons?.map((eachButton) => (
                <PopupOperationButton data={eachButton} onClick={() => Popup.close(props.uuid)} key={generateUuid()} />
            ))
        ),
        progress: () => props.data.progress !== undefined && (
            <div className="popup-item-progress-bar" style={styles.progressBar} >
                <div className="popup-item-progress-bar-filling" style={styles.progressBarFilling} />
                <div className="popup-item-progress-bar-text">
                    {progressPercent}
                </div>
            </div>
        ),
    };

    useEffect(() => {
        if (props.data.timeout !== undefined) {
            setTimeout(() => Popup.close(props.uuid), props.data.timeout);
        }
    }, []);

    return (
        <div className="popup-item">
            <div className="popup-item-top">
                <div className="popup-item-title">
                    {props.data.title}
                </div>
                <div className="popup-item-close" onClick={onClickCloseIcon} />
            </div>
            <div className="popup-item-description">
                {props.data.description}
            </div>
            {renderers.progress()}
            <div>
                {renderers.buttons()}
            </div>
        </div>
    );

    function onClickCloseIcon() {
        Popup.close(props.uuid);
    }
}
