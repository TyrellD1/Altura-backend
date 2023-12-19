type HeapNode = {
    key: string;
    expiresAt: number;
};

class MinHeap {
    private heap: HeapNode[];

    constructor() {
        this.heap = [];
    }

    private swap(indexOne: number, indexTwo: number): void {
        [this.heap[indexOne], this.heap[indexTwo]] = [this.heap[indexTwo], this.heap[indexOne]];
    }

    public insert(node: HeapNode): void {
        this.heap.push(node);
        this.heapifyUp();
    }

    private heapifyUp(): void {
        let index = this.heap.length - 1;
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].expiresAt > this.heap[index].expiresAt) {
                this.swap(parentIndex, index);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    public peek(): HeapNode | null {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    public pop(): HeapNode | null {
        if (this.heap.length === 0) {
            return null;
        }
        const smallest = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapifyDown();
        }
        return smallest;
    }

    private heapifyDown(): void {
        let index = 0;
        while (index < this.heap.length) {
            let smallest = index;
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;

            if (leftChildIndex < this.heap.length && this.heap[leftChildIndex].expiresAt < this.heap[smallest].expiresAt) {
                smallest = leftChildIndex;
            }

            if (rightChildIndex < this.heap.length && this.heap[rightChildIndex].expiresAt < this.heap[smallest].expiresAt) {
                smallest = rightChildIndex;
            }

            if (smallest !== index) {
                this.swap(smallest, index);
                index = smallest;
            } else {
                break;
            }
        }
    }
}

export { MinHeap };