import './PopupOperationButton.css';

export type PopupOperationButtonData = {
    text: string,
    onClick?: () => void,
};

export type PopupOperationButtonProps = {
    data: PopupOperationButtonData,
};

export default function PopupOperationButton(props: PopupOperationButtonProps) {
    return (
        <div className="popup-operation-button" onClick={props.data.onClick}>
            {props.data.text}
        </div>
    );
}
