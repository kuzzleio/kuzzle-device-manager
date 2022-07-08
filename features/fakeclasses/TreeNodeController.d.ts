import { RelationalController } from '../../lib/controllers/RelationalController';
import { KuzzleRequest, Plugin } from 'kuzzle';
export declare class TreeNodeController extends RelationalController {
    constructor(plugin: Plugin);
    create(request: KuzzleRequest): Promise<import("kuzzle").KDocument<{
        [x: string]: any;
    }>>;
    update(request: KuzzleRequest): Promise<import("kuzzle").KDocument<{
        [x: string]: any;
    }>>;
    delete(request: KuzzleRequest): Promise<string>;
    link(request: KuzzleRequest): Promise<void>;
    unlink(request: KuzzleRequest): Promise<void>;
}
