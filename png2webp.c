#include <stdio.h>
#include <stdlib.h>
#include <png.h>
#include <webp/encode.h>

int png_to_webp(const char *input_path, const char *output_path, float quality) {
    FILE *fp = fopen(input_path, "rb");
    if (!fp) {
        fprintf(stderr, "Failed to open %s\n", input_path);
        return 1;
    }

    png_structp png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png) {
        fclose(fp);
        fprintf(stderr, "Failed to create png read struct\n");
        return 1;
    }

    png_infop info = png_create_info_struct(png);
    if (!info) {
        png_destroy_read_struct(&png, NULL, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to create png info struct\n");
        return 1;
    }

    if (setjmp(png_jmpbuf(png))) {
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Error during png processing\n");
        return 1;
    }

    png_init_io(png, fp);
    png_read_info(png, info);

    png_uint_32 width = png_get_image_width(png, info);
    png_uint_32 height = png_get_image_height(png, info);
    png_byte color_type = png_get_color_type(png, info);
    png_byte bit_depth = png_get_bit_depth(png, info);

    if (bit_depth == 16) {
        png_set_strip_16(png);
    }

    if (color_type == PNG_COLOR_TYPE_PALETTE) {
        png_set_palette_to_rgb(png);
    }

    if (color_type == PNG_COLOR_TYPE_GRAY && bit_depth < 8) {
        png_set_expand_gray_1_2_4_to_8(png);
    }

    if (png_get_valid(png, info, PNG_INFO_tRNS)) {
        png_set_tRNS_to_alpha(png);
    }

    if (color_type == PNG_COLOR_TYPE_RGB || color_type == PNG_COLOR_TYPE_GRAY || color_type == PNG_COLOR_TYPE_PALETTE) {
        png_set_filler(png, 0xFF, PNG_FILLER_AFTER);
    }

    if (color_type == PNG_COLOR_TYPE_GRAY || color_type == PNG_COLOR_TYPE_GRAY_ALPHA) {
        png_set_gray_to_rgb(png);
    }

    int passes = png_set_interlace_handling(png);
    png_read_update_info(png, info);

    png_size_t rowbytes = png_get_rowbytes(png, info);
    png_bytep image_data = (png_bytep)malloc(rowbytes * height);
    if (!image_data) {
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to allocate image data\n");
        return 1;
    }

    png_bytep *row_pointers = (png_bytep *)malloc(sizeof(png_bytep) * height);
    if (!row_pointers) {
        free(image_data);
        png_destroy_read_struct(&png, &info, NULL);
        fclose(fp);
        fprintf(stderr, "Failed to allocate row pointers\n");
        return 1;
    }

    for (png_uint_32 y = 0; y < height; y++) {
        row_pointers[y] = image_data + y * rowbytes;
    }

    for (int pass = 0; pass < passes; pass++) {
        png_read_rows(png, row_pointers, NULL, height);
    }

    fclose(fp);
    png_destroy_read_struct(&png, &info, NULL);
    free(row_pointers);

    uint8_t *webp_data = NULL;
    size_t webp_size = WebPEncodeRGBA(image_data, width, height, rowbytes, quality, &webp_data);

    free(image_data);

    if (webp_size == 0 || webp_data == NULL) {
        fprintf(stderr, "Failed to encode %s to WebP\n", input_path);
        return 1;
    }

    FILE *out = fopen(output_path, "wb");
    if (!out) {
        WebPFree(webp_data);
        fprintf(stderr, "Failed to open output %s\n", output_path);
        return 1;
    }

    if (fwrite(webp_data, webp_size, 1, out) != 1) {
        WebPFree(webp_data);
        fclose(out);
        fprintf(stderr, "Failed to write WebP data\n");
        return 1;
    }

    fclose(out);
    WebPFree(webp_data);
    return 0;
}

int main(int argc, char **argv) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s input.png output.webp [quality]\n", argv[0]);
        return 1;
    }
    float quality = 80.0f;
    if (argc >= 4) {
        quality = atof(argv[3]);
        if (quality < 0) quality = 0;
        if (quality > 100) quality = 100;
    }
    return png_to_webp(argv[1], argv[2], quality);
}
