import { Item } from '../../../../../item';
import './ContentItem.css';

export type ContentItemProps = {
    item: Item,
};

export default function ContentItem(props: ContentItemProps) {
    const styles = {
        icon: {
            backgroundImage: `url('../../../../../../lib/img/icons/dark/${props.item.isFile() ? 'file' : 'folder'}.svg')`,
        },
    };

    const id = props.item.getItem().id.toString();

    return (
        <div className="content-item-container">
            <div className="content-item-property content-item-icon" style={styles.icon} />
            <div className="content-item-property content-item-name">
                {id}
            </div>
            <div className="content-item-detail">
            </div>
        </div>
    );
}
