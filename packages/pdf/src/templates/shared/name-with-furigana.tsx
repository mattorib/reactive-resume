import type { Style } from "../../forme/style-types";
import { View } from "#react-pdf-renderer";
import { useRender } from "../../context";
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
