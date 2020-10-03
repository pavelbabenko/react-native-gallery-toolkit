import React, { useCallback } from 'react';
import {
  Dimensions,
  View,
  Text,
  StatusBar,
  FlatList,
  Image,
} from 'react-native';
import {
  GalleryItemType,
  ScalableImage,
  Pager,
} from '../../../../src';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  Extrapolate,
  interpolate,
  withTiming,
  delay,
} from 'react-native-reanimated';
import { DetachedHeader } from '../../DetachedHeader';
import { useControls } from '../../hooks/useControls';
import { generateImageList } from '../../utils/generateImageList';
import s from './styles';

const { width } = Dimensions.get('window');

const data = [
  {
    id: '1',
    name: 'Spock',
    images: generateImageList(1, 256).images,
  },
  {
    id: '2',
    name: 'Kirk',
    images: generateImageList(12, 200).images,
  },
  {
    id: '3',
    name: 'Leonard',
    images: generateImageList(4, 50, true).images,
  },
  { id: '4', name: 'James', images: generateImageList(1, 20).images },
  {
    id: '5',
    name: 'Hikaru',
    images: generateImageList(5, 213, true).images,
  },
  {
    id: '6',
    name: 'Scotty',
    images: generateImageList(5, 14, true).images,
  },
];

const Header = ({ uri, name }) => (
  <View style={s.itemHeader}>
    <Image source={{ uri }} style={s.image} />
    <Text style={{ paddingLeft: 10 }}>{name}</Text>
  </View>
);
const Footer = () => (
  <View style={s.footerItem}>
    <View style={s.row}>
      <View style={s.pacman} />
      <View style={s.talkBubble}>
        <View style={s.talkBubbleSquare} />
        <View style={s.talkBubbleTriangle} />
      </View>
      <View style={s.coneContainer}>
        <View style={s.cone} />
        <View style={s.coneBottom} />
      </View>
    </View>
    <View style={s.flag}>
      <View style={s.flagTop} />
      <View style={s.flagBottom} />
    </View>
  </View>
);

function RenderItem({
  index: _index,
  activeItemIndex,
  item: { images, name },
  setControlsHidden,
}: {
  index: number;
  activeItemIndex: Animated.SharedValue<number>;
  item: {
    name: string;
    images: GalleryItemType[];
  };
  setControlsHidden: (shouldHide: boolean) => void;
}) {
  const opacity = useSharedValue(0);
  const backgroundScale = useSharedValue(0);

  const onScale = useCallback((scale: number) => {
    'worklet';

    opacity.value = interpolate(
      scale,
      [1, 2],
      [0, 0.7],
      Extrapolate.CLAMP,
    );

    backgroundScale.value = interpolate(
      scale,
      [1, 1.01, 2],
      [0, 4, 5],
      Extrapolate.CLAMP,
    );
  }, []);

  const onGestureStart = useCallback(() => {
    'worklet';

    setControlsHidden(true);
    StatusBar.setHidden(true);
    activeItemIndex.value = _index;
  }, []);

  const onGestureRelease = useCallback(() => {
    'worklet';

    activeItemIndex.value = delay(200, withTiming(-1)); //delay for smooth hiding background opacity
    setControlsHidden(false);
    StatusBar.setHidden(false);
  }, []);

  const overlayStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundColor: 'black',
      opacity: opacity.value,
      transform: [
        {
          scale: backgroundScale.value,
        },
      ],
    };
  });

  function keyExtractor({ id }: { id: string }) {
    return id;
  }

  function RenderPage({ item, width: _width }) {
    return (
      <ScalableImage
        windowDimensions={{
          height: _width,
          width: _width,
        }}
        source={item.uri}
        width={item.width}
        height={item.height}
        onScale={onScale}
        onGestureStart={onGestureStart}
        onGestureRelease={onGestureRelease}
      />
    );
  }

  return (
    <Animated.View style={s.itemContainer}>
      <Header uri={images[0].uri} name={name} />
      <Animated.View pointerEvents="none" style={overlayStyles} />
      <View style={[s.itemPager, { height: width }]}>
        {images.length === 1 ? (
          <ScalableImage
            windowDimensions={{
              height: width,
              width: width,
            }}
            source={images[0].uri}
            width={images[0].width}
            height={images[0].height}
            onScale={onScale}
            onGestureStart={onGestureStart}
            onGestureRelease={onGestureRelease}
          />
        ) : (
          <Pager
            pages={images}
            totalCount={images.length}
            keyExtractor={keyExtractor}
            initialIndex={0}
            width={width}
            gutterWidth={0}
            verticallyEnabled={false}
            renderPage={RenderPage}
          />
        )}
      </View>
      <Footer />
    </Animated.View>
  );
}

export default function CarouselLikeInstagramScreen() {
  const activeItemIndex = useSharedValue(-1);

  const { controlsStyles, setControlsHidden } = useControls();

  return (
    <>
      <Animated.View style={controlsStyles}>
        <DetachedHeader.Container>
          <DetachedHeader />
        </DetachedHeader.Container>
      </Animated.View>
      <FlatList
        contentContainerStyle={s.containerStyle}
        data={data}
        keyExtractor={({ id }) => `${id}`}
        renderItem={(item) => (
          <RenderItem
            {...item}
            activeItemIndex={activeItemIndex}
            setControlsHidden={setControlsHidden}
          />
        )}
        CellRendererComponent={({
          children,
          index,
          style,
          ...props
        }) => {
          const animatedStyles = useAnimatedStyle(() => {
            if (
              activeItemIndex.value !== -1 &&
              activeItemIndex.value === index
            ) {
              return {
                zIndex: 1,
              };
            }
            return {
              zIndex: 0,
            };
          });
          return (
            <Animated.View
              style={[animatedStyles]}
              index={index}
              {...props}
            >
              {children}
            </Animated.View>
          );
        }}
      />
    </>
  );
}
