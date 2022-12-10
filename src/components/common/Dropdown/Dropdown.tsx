import DropdownItem, { DropdownItemData } from "./DropdownItem/DropdownItem";
import './Dropdown.css';
import { preferences } from "../../../common/preferences";
import { Dispatch, SetStateAction } from "react";

export type DropdownProps = {
    displayed: [boolean, Dispatch<SetStateAction<boolean>>],
    pivot: [number, number],
    items: DropdownItemData[],
};

export default function Dropdown(props: DropdownProps) {
    const [displayed, setDisplayed] = props.displayed;

    const styles = {
        container: {
            backgroundColor: preferences.appearance.background.panel1,
            display: displayed ? 'flex' : 'none',
            top: props.pivot[1],
            left: props.pivot[0],
        },
    };

    const itemElems = props.items.map((eachItem) => (
        <DropdownItem data={eachItem} key={eachItem.id} />
    ));

    return (
        <div className="dropdown" style={styles.container}>
            {itemElems}
        </div>
    );
}
