import { useContext } from "react";
import { TempDataContext } from "./temp_context";
import type { ChildrenProviderProps } from "./utils";
import AppLoading from "./apploading";

export const AppContainer: React.FC<ChildrenProviderProps> = (props: ChildrenProviderProps) => {
    const {initialLoadComplete} = useContext(TempDataContext)

    if (initialLoadComplete) {
        return (props.children)
    } else {
        return (
            <AppLoading></AppLoading>
        )
    }

}