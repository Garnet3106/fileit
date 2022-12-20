import './PopupOperationButton.css';

export type PopupOperationButtonData = {
    text: string,
    onClick?: () => void,
};

export type PopupOperationButtonProps = {
    data: PopupOperationButtonData,
    onClick?: () => void,
};

export default function PopupOperationButton(props: PopupOperationButtonProps) {
    return (
        <div className="popup-operation-button" onClick={onClick}>
            {props.data.text}
        </div>
    );

    function onClick() {
        if (props.onClick !== undefined) {
            props.onClick();
        }

        if (props.data.onClick !== undefined) {
            props.data.onClick();
        }
    }
}
