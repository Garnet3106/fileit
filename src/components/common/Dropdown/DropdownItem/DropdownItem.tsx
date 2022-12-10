import './DropdownItem.css';

export type DropdownItemData = {
    id: string,
    value: JSX.Element | string,
    onClick?: () => void,
};

export type DropdownItemProps = {
    data: DropdownItemData,
};

export default function DropdownItem(props: DropdownItemProps) {
    return (
        <div className="dropdown-item" onClick={props.data.onClick}>
            {props.data.value}
        </div>
    );
}
