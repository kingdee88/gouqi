import * as React from 'react'
import { ITrack } from '../services/api'
import {
  ListView,
  TouchableWithoutFeedback,
  View,
  RefreshControl,
  ListViewDataSource
} from 'react-native'
import ListItem from './listitem'
import { get, isEqual } from 'lodash'
import { Color } from '../styles'
import Ionic from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'
import {
  popupTrackActionSheet,
  playTrackAction
} from '../actions'
import { IPlaylistProps } from '../interfaces'

interface IProps extends IPlaylistProps, IOwnProps {}

interface IOwnProps {
  isLoading: boolean,
  sync?: () => Redux.Action,
  tracks: ITrack[]
  pid: any,
  canRefresh?: boolean
}

class TrackList extends React.Component<IProps, any> {
  private ds: ListViewDataSource

  constructor(props: IProps) {
    super(props)
    this.ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.id !== r2.id})
  }

  componentDidMount() {
    this.sync()
  }

  componentWillReceiveProps (nextProps: IProps) {
    if (!isEqual(nextProps.playing, this.props.playing)) {
      this.ds = this.ds.cloneWithRows([])
    }
  }

  renderTrack = (playing, isPlaylist: boolean) => {
    return (track: ITrack, sectionId, rowId) => {
      const index = Number(rowId)
      const isPlaying = playing.index === index && isPlaylist
      const artistName = get(track, 'artists[0].name', null)
      const albumName = get(track, 'album.name', '')
      const subTitle = artistName ?
        `${artistName} - ${albumName}` :
        albumName
      const colorStyle = isPlaying && { color: Color.main }
      return <ListItem
        title={track.name}
        containerStyle={{ paddingVertical: 0, paddingRight: 0 }}
        picURI={track.album.picUrl + '?param=75y75'}
        subTitle={subTitle}
        textContainer={{ paddingVertical: 10 }}
        picStyle={{ width: 40, height: 40}}
        titleStyle={[{ fontSize: 15 }, colorStyle]}
        subTitleStyle={colorStyle}
        onPress={!isPlaying ? this.listItemOnPress(index) : undefined}
        renderRight={
          <TouchableWithoutFeedback
            onPress={this.moreIconOnPress(track)}
          >
            <View style={{flexDirection: 'row', paddingRight: 10}}>
              {isPlaying && <View style={{ justifyContent: 'center' }}>
                <Ionic size={22} name='md-volume-up' color={Color.main} style={{ paddingLeft: 10 }}/>
              </View>}
              <View style={{ justifyContent: 'center' }}>
                <Ionic size={22} name='ios-more' color='#777' style={{ paddingLeft: 10 }}/>
              </View>
            </View>
          </TouchableWithoutFeedback>
        }
        key={track.id}
      />
    }
  }

  listItemOnPress = (id: number) => () => {
    this.props.play(id, this.props.tracks)
  }

  moreIconOnPress = (track: ITrack) => () => {
    this.props.popup(track)
  }

  sync = () => {
    const {
      sync
    } = this.props
    if (sync) {
      sync()
    }
  }

  render() {
    const {
      tracks,
      playing,
      isPlaylist,
      isLoading,
      sync,
      canRefresh = false
    } = this.props
    if (tracks) {
      this.ds = this.ds.cloneWithRows(tracks)
    }

    return (
      <ListView
        enableEmptySections
        removeClippedSubviews={true}
        scrollRenderAheadDistance={120}
        initialListSize={10}
        dataSource={this.ds}
        renderRow={this.renderTrack(playing, isPlaylist)}
        showsVerticalScrollIndicator={true}
        refreshControl={
          canRefresh ? <RefreshControl refreshing={isLoading} onRefresh={sync}/> : undefined
        }
      />
    )
  }

}

function mapStateToProps (
  {
    player: {
      playing
    }
  },
  ownProps: IOwnProps
) {
  return {
    playing,
    isPlaylist: playing.pid === ownProps.pid
  }
}

export default connect(
  mapStateToProps,
  (dispatch, ownProps: IOwnProps) => ({
    popup(track: ITrack) {
      return dispatch(popupTrackActionSheet(track))
    },
    play(index: number, tracks: ITrack[]) {
      return dispatch(playTrackAction({
        playing: {
          index,
          pid: ownProps.pid
        },
        playlist: tracks
      }))
    }
  })
)(TrackList)