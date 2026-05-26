import type { Style } from "@react-pdf/types";
import { useRender } from "../../context";
import { View } from "../../renderer";
import { Heading, Text } from "./primitives";

type Props = { nameStyle?: Style };

export const NameWithFurigana = ({ nameStyle }: Props) => {
	const { basics } = useRender();

	return (
		<View style={{ flexDirection: "column" }}>
			{basics.furigana && <Text style={{ fontSize: 9, opacity: 0.7 }}>{basics.furigana}</Text>}
			<Heading {...(nameStyle !== undefined ? { style: nameStyle } : {})}>{basics.name}</Heading>
		</View>
	);
};
