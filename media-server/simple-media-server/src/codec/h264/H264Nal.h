#pragma once

// https://github.com/zoltanmaric/h264-fer/blob/master/FER-H264/FER-H264/nal.cpp
// https://github.com/GStreamer/gst-plugins-bad/blob/ca8068c6d793d7aaa6f2e2cc6324fdedfe2f33fa/gst-libs/gst/codecparsers/gsth264parser.c#L1553
// https://github-wiki-see.page/m/uupaa/H264.js/wiki/TechnicalTerm

// NALUnitSize, NumBytesInNALunit
// - NALUnit のサイズを示す情報です
// - NALUnit のサイズが 4 byte なら | 00 00 00 04 | NALUnit | になります
// - 通常 4 byte ですが 1 byte または 2 byte のケースもありえます
//     - AVCDecoderConfigurationRecord.lengthSizeMinusOne + 1 が2 なら NALUnitSize のサイズは 2 になります

// +------------------------------+-----------------------+------------------------------+-----------------------+--
// |          NALUnitSize         |        NALUnit        |          NALUnitSize         |        NALUnit        |
// |   UB[lengthSizeMinusOne+1)   |   UB[8*NALUnitSize]   |   UB[lengthSizeMinusOne+1)   |   UB[8*NALUnitSize]   |
// +------------------------------+-----------------------+------------------------------+-----------------------+--

// https://mntone.hateblo.jp/entry/2013/09/03/180431

// nal_unit( NumBytesInNALunit ) {                             Categories  Descriptor
//     forbidden_zero_bit                                      All         f(1)        1 bit, 常に 0
//     nal_ref_idc                                             All         u(2)        2 bit, 0 以外なら参照すべき idc があります
//     nal_unit_type                                           All         u(5)        5 bit, 
//     NumBytesInRBSP = 0
//     nalUnitHeaderBytes = 1
//     if ( nal_unit_type == 14 || nal_unit_type == 20 ) {
//         svc_extension_flag                                  All         u(1)
//         if( svc_extension_flag ) {
//             nal_unit_header_svc_extension( )                All             // specified in Annex G
//         } else {
//             nal_unit_header_mvc_extension( )                All             // specified in Annex H
//         }
//         nalUnitHeaderBytes += 3
//     }
//     for( i = nalUnitHeaderBytes; i < NumBytesInNALunit; i++ ) {
//         if( i + 2 < NumBytesInNALunit && next_bits( 24 ) == 0x000003 ) {
//             rbsp_byte[ NumBytesInRBSP++ ]                   All         b(8)
//             rbsp_byte[ NumBytesInRBSP++ ]                   All         b(8)
//             i += 2
//             emulation_prevention_three_byte                 All         f(8)    // equal to 0x03
//         } else {
//             rbsp_byte[ NumBytesInRBSP++ ]                   All         b(8)
//         }
//     }
// }

// nal_unit_type値	NAL ユニット名	概要
// 0	Unspecified	無指定
// 1	Coded slice of a non-IDR picture	
// 2	Coded slice data partition A	
// 3	Coded slice data partition B	
// 4	Coded slice data partition C	
// 5	Coded slice of an IDR picture	
// 6	Supplemental enhancement information	通称「SEI」。
// 7	Sequence parameter set	通称「SPS」。
// 8	Picture parameter set	通称「PPS」。
// 9	Access unit delimiter	通称「AUD」。
// 10	End of sequence	
// 11	End of stream	
// 12	Fillter data	
// 13	Sequence parameter set extension	
// 14	Prefix NAL unit	
// 15	Subset sequence parameter set	
// 16-18	Reserved	予約
// 19	Coded slice of an auxiliaryy coded picture without partitioning	
// 20	Coded slice extension	
// 21	Coded slice extension for depth view components	
// 22-23	Reserved	予約
// 24-31	


// https://gist.github.com/uupaa/8493378ec15f644a3d2b
// https://stackoverflow.com/questions/11172534/how-to-inspect-h264-avc-iso-iec-14496-15-avcdecoderconfigurationrecord

// aligned(8) class AVCDecoderConfigurationRecord {
//   unsigned int(8) configurationVersion = 1;
//   unsigned int(8) AVCProfileIndication;
//   unsigned int(8) profile_compatibility;
//   unsigned int(8) AVCLevelIndication;
//   bit(6) reserved = ‘111111’b;
//   unsigned int(2) lengthSizeMinusOne;
//   bit(3) reserved = ‘111’b;
//   unsigned int(5) numOfSequenceParameterSets;
//   for (i=0; i< numOfSequenceParameterSets; i++) {
//     unsigned int(16) sequenceParameterSetLength ;
//     bit(8*sequenceParameterSetLength) sequenceParameterSetNALUnit;
//   }
//   unsigned int(8) numOfPictureParameterSets;
//   for (i=0; i< numOfPictureParameterSets; i++) {
//     unsigned int(16) pictureParameterSetLength;
//     bit(8*pictureParameterSetLength) pictureParameterSetNALUnit;
//   }
// }