import { Selectable, Model, Selection, Eventer, Mix } from 'entcore-toolkit';
import http from "axios";
import { Shareable, Rights, notify, moment, model } from 'entcore';
import { Folders, Folder, Filters } from './folder';
type MongoDate = {
    $date: number
};
type PostData = { _id: string, created: MongoDate, modified: MongoDate, firstPublishDate: MongoDate, title: string }
type BlogData = { _id: string, author: { userId: string, username: string }, title: string, thumbnail: string, created: MongoDate, modified: MongoDate };
export class Blog extends Model<Blog> implements Selectable, Shareable {
    static eventer = new Eventer();
    _id: string;
    'comment-type': "RESTRAINT" | "IMMEDIATE" = "IMMEDIATE";
    'publish-type': "RESTRAINT" | "IMMEDIATE" = "RESTRAINT";
    selected: boolean;
    thumbnail: string;
    description: string;
    rights: Rights<Blog> = new Rights(this);
    owner: { userId: string, displayName: string };
    shared: any;
    trashed: boolean = false;
    title: string;
    shortenedTitle: string;
    visibility: 'PUBLIC' | 'OWNER' = "OWNER";
    icon: string;
    fetchPosts: Array<PostData>
    modified: {
        $date: number
    };
    created: {
        $date: number
    };
    author: { userId: string, username: string }
    realLastModified: number;
    slug: string
    get realLastModifiedFormat() {
        return moment(this.realLastModified).format('DD/MM/YYYY');
    }
    get lastModified(): string {
        return moment(this.modified.$date).format('DD/MM/YYYY');
    }
    constructor(data?: BlogData) {
        super({
            create: '/blog',
            update: '/blog/:_id',
            sync: '/blog/:_id'
        });
        this.fromJSON(data);
    }
    async fromJSON(data: BlogData) {
        if (data) {
            for (let i in data) {
                this[i] = data[i];
            }
            this._id = data._id;
            this.owner = data.author as any;
            this.shortenedTitle = data.title || '';
            if (this.shortenedTitle.length > 35) {
                this.shortenedTitle = this.shortenedTitle.substr(0, 33) + '...';
            }
            this.icon = data.thumbnail ? data.thumbnail + '?thumbnail=290x290' : '';
            this.realLastModified = data.modified ? data.modified.$date :
                data.created ? data.created.$date : 0;
            if (this.fetchPosts) {
                this.fetchPosts.forEach(p => {
                    if (p.modified && this.realLastModified < p.modified.$date) {
                        this.realLastModified = p.modified.$date;
                    }
                })
            }
        }
        this.rights.fromBehaviours();
    }
    get myRights() {
        return this.rights.myRights;
    }
    async save() {
        const json = this.toJSON();
        if (this._id) {
            await this.update(json as any);
        }
        else {
            const { trashed, ...others } = json
            const res = await this.create(others as any);
            //refresh
            this._id = res.data._id;
            this.owner = {
                userId: model.me.userId,
                displayName: model.me.username
            }
            this.modified = {
                $date: new Date().getTime()
            }
            this.realLastModified = new Date().getTime();
            this.created = {
                $date: new Date().getTime()
            }
            this.author = {
                userId: model.me.userId,
                username: model.me.username
            }
            this.rights.fromBehaviours();
            //update root
            Folders.provideRessource(this);
            Folders.root.ressources.all.push(this);
            Folders.root.ressources.refreshFilters();
            Folder.eventer.trigger('refresh');
        }
        Blog.eventer.trigger('save');
    }
    async  remove() {
        Folders.unprovide(this);
        await http.delete('/blog/' + this._id);
    }
    async create(item?: Blog, opts?: {}) {
        const visibility = item && item.visibility ? item.visibility : this.visibility;
        this.api.create = visibility == "PUBLIC" ? '/blog/pub' : '/blog';
        const ret = super.create(item, opts)
        Folders.onChange.next(!((await Folders.ressources()).length || (await Folders.folders()).length)); // ICI
        return ret;
    }
    update(item?: Blog, opts?: {}) {
        const visibility = item && item.visibility ? item.visibility : this.visibility;
        this.api.update = visibility == "PUBLIC" ? '/blog/pub/:_id' : '/blog/:_id';
        return super.update(item, opts)
    }
    async restore(){
        if(this.owner.userId==model.me.userId || this.myRights.manager){
            this.trashed = false;
            await this.save();
            const shouldUnlink = await this.isParentTrashed();
            if(shouldUnlink){
                await this.unlinkParent();
            }
        }
    }
    async toTrash() {
        if(this.owner.userId==model.me.userId || this.myRights.manager){
            this.slug = null;
            this.visibility = "OWNER";
            this.trashed = true;
            await this.save();
            Folders.trash.sync();
        }else{
            //shared ressources are moved to root
            await this.unlinkParent();
        }
    }
    async unlinkParent(){
        const origins = await Folders.findFoldersContaining(this);
        const promises = origins.map(async origin => {
            origin.detachRessource(this._id);
            await origin.save();
        });
        await Promise.all(promises);
    }
    async isParentTrashed(){
        const origins = await Folders.findFoldersContaining(this);
        for(let or of origins){
            if(or.trashed){
                return true;
            }
        }
        return false;
    }
    async moveTo(target: Folder | string) {
        const origins = await Folders.findFoldersContaining(this);
        const promises = origins.map(async origin => {
            origin.detachRessource(this._id);
            await origin.save();
        });
        await Promise.all(promises);
        if (target instanceof Folder && target._id) {
            target.attachRessource(this._id);
            await target.save();
            await Folders.root.sync();
        }
        else {
            await Folders.root.sync();
            if (target === 'trash') {
                await this.toTrash();
            }
        }
    }
    copy(): Blog {
        let data = JSON.parse(JSON.stringify(this));
        data.published = undefined;
        data.title = "Copie_" + data.title;
        return Mix.castAs(Blog, data);
    }

    toJSON() {
        const { trashed } = this;
        const json = {
            visibility: this.visibility || "OWNER",
            slug: this.slug,
            trashed,
            _id: this._id,
            title: this.title,
            thumbnail: this.thumbnail || '',
            'comment-type': this['comment-type'] || 'IMMEDIATE',
            'publish-type': this['publish-type'] || 'RESTRAINT',
            description: this.description || ''
        };
        // add folder if needed
        const urlSearchParams = new URLSearchParams(window.location.search);
        if(urlSearchParams.has("folderid")){
            (json as any).folder = urlSearchParams.get("folderid")
        }
        return json;
    }
}


export class Blogs {
    filtered: Blog[];
    sel: Selection<Blog>;

    get all(): Blog[] {
        return this.sel.all;
    }

    set all(list: Blog[]) {
        this.sel.all = list;
    }

    constructor() {
        this.sel = new Selection([]);
    }

    async fill(ids: string[]): Promise<void> {
        let blogs = await Folders.ressources();
        this.all = blogs.filter(
            w => ids.indexOf(w._id) !== -1 && !w.trashed
        );
        this.refreshFilters();
    }

    async duplicateSelection(): Promise<void> {
        for (let blog of this.sel.selected) {
            let copy = blog.copy();
            await copy.save();
            await copy.rights.fromBehaviours();
            this.all.push(copy);
            Folders.provideRessource(copy);
        }
        this.refreshFilters();
    }

    removeSelection() {
        this.sel.selected.forEach(function (blog) {
            blog.remove();
        });
        this.sel.removeSelection();
        notify.info('blog.removed');
    }

    async toTrash(): Promise<any> {
        for (let blog of this.all) {
            await blog.toTrash();
        }
    }

    removeBlog(blog: Blog) {
        let index = this.all.indexOf(blog);
        this.all.splice(index, 1);
    }

    refreshFilters() {
        this.filtered = this.all.filter(
            w => {
                return Filters.shared && w.author.userId != model.me.userId
                    || Filters.mine && w.author.userId == model.me.userId
                    || Filters.public && w.visibility == "PUBLIC";
            }
        );
    }

    deselectAll() {
        this.sel.deselectAll();
    }
}
