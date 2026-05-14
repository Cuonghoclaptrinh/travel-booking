import { useMemo, useState } from "react";

export interface TableQueryState {
    page: number;
    limit: number;
    keyword: string;
}

interface UseTableQueryOptions {
    defaultPage?: number;
    defaultLimit?: number;
    defaultKeyword?: string;
}

export function useTableQuery(options?: UseTableQueryOptions) {
    const [page, setPage] = useState<number>(options?.defaultPage ?? 1);
    const [limit, setLimit] = useState<number>(options?.defaultLimit ?? 10);
    const [keyword, setKeyword] = useState<string>(options?.defaultKeyword ?? "");
    const [reloadKey, setReloadKey] = useState<number>(0);

    const query = useMemo(
        () => ({
            page,
            limit,
            keyword,
        }),
        [page, limit, keyword]
    );

    const onSearch = (value: string) => {
        setPage(1);
        setKeyword(value);
    };

    const onChangePage = (nextPage: number, nextLimit?: number) => {
        setPage(nextPage);

        if (nextLimit && nextLimit !== limit) {
            setLimit(nextLimit);
        }
    };

    const reload = () => {
        setReloadKey((prev) => prev + 1);
    };

    const reset = () => {
        setPage(options?.defaultPage ?? 1);
        setLimit(options?.defaultLimit ?? 10);
        setKeyword(options?.defaultKeyword ?? "");
        setReloadKey((prev) => prev + 1);
    };

    return {
        page,
        limit,
        keyword,
        query,
        reloadKey,
        setPage,
        setLimit,
        setKeyword,
        onSearch,
        onChangePage,
        reload,
        reset,
    };
}